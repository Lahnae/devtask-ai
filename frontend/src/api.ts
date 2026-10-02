import type { Project, ProjectInput, TaskInput, TaskItem, TaskStatus } from './types'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const tokenKey = 'devtask.accessToken'
const expiryKey = 'devtask.tokenExpiresAt'

function accessToken() {
  const token = sessionStorage.getItem(tokenKey)
  const expiresAt = Number(sessionStorage.getItem(expiryKey))
  if (!token || !expiresAt || expiresAt <= Date.now()) {
    const hadToken = token !== null
    sessionStorage.removeItem(tokenKey)
    sessionStorage.removeItem(expiryKey)
    if (hadToken) window.dispatchEvent(new Event('devtask:unauthorized'))
    return null
  }
  return token
}

export const authSession = {
  isActive: () => accessToken() !== null,
  save: (token: string, expiresAt: string) => {
    sessionStorage.setItem(tokenKey, token)
    sessionStorage.setItem(expiryKey, String(new Date(expiresAt).getTime()))
  },
  clear: () => {
    sessionStorage.removeItem(tokenKey)
    sessionStorage.removeItem(expiryKey)
  },
}

async function request<T>(path: string, init?: RequestInit, authenticated = true): Promise<T> {
  const token = authenticated ? accessToken() : null
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401 && token) {
      authSession.clear()
      window.dispatchEvent(new Event('devtask:unauthorized'))
    }
    const message = await response.text()
    throw new Error(message || `Request failed (${response.status})`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  login: (username: string, password: string) => request<{ accessToken: string; expiresAt: string }>(
    '/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }, false),
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
