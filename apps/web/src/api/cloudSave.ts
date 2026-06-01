import { api } from './client'
import type {
  CloudSaveSummary,
  CloudSaveDetail,
  CreateSaveRequest,
  UpdateSaveRequest,
  SaveMutationResponse,
} from '@cafe-tycoon/shared'

export async function listCloudSaves(): Promise<CloudSaveSummary[]> {
  return api<CloudSaveSummary[]>('/save')
}

export async function getCloudSave(saveId: string): Promise<CloudSaveDetail> {
  return api<CloudSaveDetail>(`/save/${saveId}`)
}

export async function createCloudSave(payload: CreateSaveRequest): Promise<SaveMutationResponse> {
  return api<SaveMutationResponse>('/save', { method: 'POST', body: payload })
}

export async function updateCloudSave(
  saveId: string,
  payload: UpdateSaveRequest,
): Promise<SaveMutationResponse> {
  return api<SaveMutationResponse>(`/save/${saveId}`, { method: 'PUT', body: payload })
}

export async function deleteCloudSave(saveId: string): Promise<void> {
  await api(`/save/${saveId}`, { method: 'DELETE' })
}
