import { db, type SaveSlotRecord, type SnapshotRecord } from './schema'
import type { SaveData } from '@cafe-tycoon/shared'
import { GAME_CONFIG } from '@cafe-tycoon/shared'
import { migrateSaveData } from './migrations'

const CURRENT_SAVE_VERSION = 1 as const

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text)
  const hashBuf = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

class SaveManager {
  private autosaveTimer: ReturnType<typeof setInterval> | null = null
  private currentSaveId: number | null = null
  private bootstrapped = false

  async bootstrap(): Promise<void> {
    if (this.bootstrapped) return
    await db.open()
    this.bootstrapped = true
  }

  getCurrentSaveId(): number | null {
    return this.currentSaveId
  }

  setCurrentSaveId(id: number): void {
    this.currentSaveId = id
  }

  async listSlots(): Promise<SaveSlotRecord[]> {
    return db.saveSlots.orderBy('updatedAt').reverse().toArray()
  }

  async loadLatest(): Promise<{ slot: SaveSlotRecord; data: SaveData } | null> {
    const slot = await db.saveSlots.orderBy('updatedAt').reverse().first()
    if (!slot || slot.id == null) return null
    const snap = await db.snapshots.get(slot.id)
    if (!snap) return null
    this.currentSaveId = slot.id
    return { slot, data: migrateSaveData(snap.data as SaveData & { version: number }) }
  }

  async loadById(saveId: number): Promise<{ slot: SaveSlotRecord; data: SaveData } | null> {
    const [slot, snap] = await Promise.all([
      db.saveSlots.get(saveId),
      db.snapshots.get(saveId),
    ])
    if (!slot || !snap) return null
    this.currentSaveId = slot.id ?? null
    return { slot, data: migrateSaveData(snap.data as SaveData & { version: number }) }
  }

  async createSlot(slotName: string, cafeName: string, initial: SaveData): Promise<number> {
    const now = Date.now()
    const checksum = await sha256(JSON.stringify(initial))
    const id = await db.saveSlots.add({
      slotName,
      cafeName,
      createdAt: now,
      updatedAt: now,
      playtimeSeconds: 0,
      cloudSynced: false,
      checksum,
    } satisfies Omit<SaveSlotRecord, 'id'>)
    await db.snapshots.put({ saveId: id, data: initial, storedAt: now })
    this.currentSaveId = id
    return id
  }

  async save(data: SaveData): Promise<void> {
    if (this.currentSaveId == null) {
      throw new Error('No active save slot')
    }
    const slotId = this.currentSaveId
    const now = Date.now()
    const json = JSON.stringify({ ...data, version: CURRENT_SAVE_VERSION })
    const checksum = await sha256(json)
    await db.transaction('rw', db.saveSlots, db.snapshots, async () => {
      await db.snapshots.put({ saveId: slotId, data, storedAt: now })
      const slot = await db.saveSlots.get(slotId)
      if (!slot) return
      await db.saveSlots.update(slotId, {
        updatedAt: now,
        cafeName: data.cafe.name,
        playtimeSeconds: data.meta.playtimeSeconds,
        cloudSynced: false,
        checksum,
      })
    })
  }

  startAutosave(getData: () => SaveData | null): void {
    this.stopAutosave()
    this.autosaveTimer = setInterval(async () => {
      try {
        const data = getData()
        if (data && this.currentSaveId != null) {
          await this.save(data)
        }
      } catch (err) {
        console.warn('autosave failed', err)
      }
    }, GAME_CONFIG.AUTOSAVE_INTERVAL_MS)
  }

  stopAutosave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer)
      this.autosaveTimer = null
    }
  }

  async deleteSlot(saveId: number): Promise<void> {
    const tables = [
      db.saveSlots,
      db.snapshots,
      db.staff,
      db.menuItems,
      db.inventory,
      db.financials,
      db.reviews,
      db.floorLayouts,
      db.gameStates,
    ]
    await db.transaction('rw', tables, async () => {
      await Promise.all([
        db.saveSlots.delete(saveId),
        db.snapshots.delete(saveId),
        db.staff.where('saveId').equals(saveId).delete(),
        db.menuItems.where('saveId').equals(saveId).delete(),
        db.inventory.where('saveId').equals(saveId).delete(),
        db.financials.where('saveId').equals(saveId).delete(),
        db.reviews.where('saveId').equals(saveId).delete(),
        db.floorLayouts.delete(saveId),
        db.gameStates.delete(saveId),
      ])
    })
    if (this.currentSaveId === saveId) this.currentSaveId = null
  }

  async exportJson(saveId?: number): Promise<string> {
    const targetId = saveId ?? this.currentSaveId
    if (targetId == null) throw new Error('No save to export')
    const slot = await db.saveSlots.get(targetId)
    const snap = await db.snapshots.get(targetId)
    if (!slot || !snap) throw new Error('Save not found')
    return JSON.stringify(
      { format: 'cafe-tycoon/save', version: CURRENT_SAVE_VERSION, slot, data: snap.data },
      null,
      2,
    )
  }

  async importJson(json: string): Promise<number> {
    let parsed: { format?: string; version?: number; slot?: SaveSlotRecord; data?: SaveData }
    try {
      parsed = JSON.parse(json)
    } catch {
      throw new Error('Invalid JSON')
    }
    if (parsed.format !== 'cafe-tycoon/save' || !parsed.slot || !parsed.data) {
      throw new Error('Unrecognized save file')
    }
    const data = migrateSaveData(parsed.data as SaveData & { version: number })
    const slot = parsed.slot
    const id = await this.createSlot(slot.slotName, slot.cafeName, data)
    return id
  }

  async markCloudSynced(saveId: number, cloudSaveId: string): Promise<void> {
    await db.saveSlots.update(saveId, { cloudSynced: true, cloudSaveId })
  }

  async getDirtySaves(): Promise<SaveSlotRecord[]> {
    return db.saveSlots.filter((s) => !s.cloudSynced).toArray()
  }

  async computeChecksum(data: SaveData): Promise<string> {
    return sha256(JSON.stringify({ ...data, version: CURRENT_SAVE_VERSION }))
  }
}

export const saveManager = new SaveManager()
