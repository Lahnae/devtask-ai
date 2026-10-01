export type TaskStatus = 'Todo' | 'InProgress' | 'Done'
export type TaskPriority = 'Low' | 'Medium' | 'High'

export interface Project {
  id: number
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  taskCount: number
  completedTaskCount: number
}

export interface TaskItem {
  id: number
  projectId: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  createdAt: string
}

export interface ProjectInput {
  name: string
  description: string
}

export interface TaskInput {
  title: string
  description: string
  priority: TaskPriority
  dueDate: string | null
}
