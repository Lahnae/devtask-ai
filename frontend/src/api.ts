import type { Project, ProjectInput, TaskInput, TaskItem, TaskStatus } from './types'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed (${response.status})`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  getProjects: () => request<Project[]>('/api/projects'),
  createProject: (input: ProjectInput) => request<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  updateProject: (id: number, input: ProjectInput) => request<Project>(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  }),
  deleteProject: (id: number) => request<void>(`/api/projects/${id}`, { method: 'DELETE' }),
  getTasks: (projectId: number) => request<TaskItem[]>(`/api/projects/${projectId}/tasks`),
  createTask: (projectId: number, input: TaskInput) => request<TaskItem>(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  updateTaskStatus: (projectId: number, taskId: number, status: TaskStatus) =>
    request<TaskItem>(`/api/projects/${projectId}/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteTask: (projectId: number, taskId: number) =>
    request<void>(`/api/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' }),
}
