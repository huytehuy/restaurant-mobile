// Schema migrations live with the Dexie version() chain in schema.ts.
// This module holds DATA migrations: rules for moving SaveData blobs from
// one save format (SaveData.version) to the next. Add new branches when
// you bump SaveData.version in @cafe-tycoon/shared.

import type { SaveData } from '@cafe-tycoon/shared'

type RawSave = SaveData & { version: number }

export function migrateSaveData(raw: RawSave): SaveData {
  let s = raw
  // Future: if (s.version < 2) s = upgradeV1ToV2(s as any)
  return s
}
