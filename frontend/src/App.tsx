import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { api, authSession } from './api'
import LoginScreen from './LoginScreen'
import type { Project, ProjectInput, TaskInput, TaskItem, TaskPriority, TaskStatus } from './types'
import './App.css'

const statusLabels: Record<TaskStatus, string> = {
  Todo: 'To do',
  InProgress: 'In progress',
  Done: 'Done',
}
const statusOrder: TaskStatus[] = ['Todo', 'InProgress', 'Done']
const colors = ['violet', 'blue', 'orange']
const projectColor = (id: number) => colors[id % colors.length]
const friendlyError = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong.'

function App() {
  const [authenticated, setAuthenticated] = useState(() => authSession.isActive())
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)

  const loadWorkspace = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const projectList = await api.getProjects()
      const taskGroups = await Promise.all(projectList.map((project) => api.getTasks(project.id)))
      setProjects(projectList)
      setTasks(taskGroups.flat())
    } catch (requestError) {
      setError(`Could not load workspace data. Check that the API and SQL database are available. ${friendlyError(requestError)}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (authenticated) void loadWorkspace() }, [loadWorkspace, authenticated])
  useEffect(() => {
    const onUnauthorized = () => setAuthenticated(false)
    window.addEventListener('devtask:unauthorized', onUnauthorized)
    return () => window.removeEventListener('devtask:unauthorized', onUnauthorized)
  }, [])

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null
  const projectTasks = useMemo(
    () => tasks.filter((task) => task.projectId === selectedProjectId),
    [selectedProjectId, tasks],
  )
  const openTaskCount = tasks.filter((task) => task.status !== 'Done').length
  const completedTaskCount = tasks.filter((task) => task.status === 'Done').length
  const recentTasks = [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  if (!authenticated) {
    return <LoginScreen onLogin={() => { setError(''); setAuthenticated(true) }} />
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const input: ProjectInput = {
      name: String(data.get('name') ?? '').trim(),
      description: String(data.get('description') ?? '').trim(),
    }
    if (!input.name) return
    setSaving(true)
    setError('')
    try {
      const project = await api.createProject(input)
      setProjects((current) => [project, ...current])
      setSelectedProjectId(project.id)
      setShowProjectForm(false)
    } catch (requestError) {
      setError(`Could not create project. ${friendlyError(requestError)}`)
    } finally {
      setSaving(false)
    }
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedProject) return
    const data = new FormData(event.currentTarget)
    const input: TaskInput = {
      title: String(data.get('title') ?? '').trim(),
      description: String(data.get('description') ?? '').trim(),
      priority: String(data.get('priority') ?? 'Medium') as TaskPriority,
      dueDate: String(data.get('dueDate') ?? '') || null,
    }
    if (!input.title) return
    setSaving(true)
    setError('')
    try {
      const task = await api.createTask(selectedProject.id, input)
      setTasks((current) => [...current, task])
      setProjects((current) => current.map((project) => project.id === selectedProject.id
        ? { ...project, taskCount: project.taskCount + 1, updatedAt: task.createdAt }
        : project))
      setShowTaskForm(false)
    } catch (requestError) {
      setError(`Could not create task. ${friendlyError(requestError)}`)
    } finally {
      setSaving(false)
    }
  }

  async function changeTaskStatus(task: TaskItem, status: TaskStatus) {
    setError('')
    try {
      const updated = await api.updateTaskStatus(task.projectId, task.id, status)
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item))
      setProjects((current) => current.map((project) => project.id === task.projectId
        ? { ...project, completedTaskCount: Math.max(0, project.completedTaskCount + (status === 'Done' ? 1 : 0) - (task.status === 'Done' ? 1 : 0)) }
        : project))
    } catch (requestError) {
      setError(`Could not update task. ${friendlyError(requestError)}`)
    }
  }

  async function deleteTask(task: TaskItem) {
    if (!window.confirm(`Delete “${task.title}”?`)) return
    setError('')
    try {
      await api.deleteTask(task.projectId, task.id)
      setTasks((current) => current.filter((item) => item.id !== task.id))
      setProjects((current) => current.map((project) => project.id === task.projectId
        ? { ...project, taskCount: Math.max(0, project.taskCount - 1), completedTaskCount: Math.max(0, project.completedTaskCount - (task.status === 'Done' ? 1 : 0)) }
        : project))
    } catch (requestError) {
      setError(`Could not delete task. ${friendlyError(requestError)}`)
    }
  }

  async function deleteProject() {
    if (!selectedProject || !window.confirm(`Delete “${selectedProject.name}” and all its tasks?`)) return
    setError('')
    try {
      await api.deleteProject(selectedProject.id)
      setProjects((current) => current.filter((project) => project.id !== selectedProject.id))
      setTasks((current) => current.filter((task) => task.projectId !== selectedProject.id))
      setSelectedProjectId(null)
    } catch (requestError) {
      setError(`Could not delete project. ${friendlyError(requestError)}`)
    }
  }

  const projectLabel = selectedProject ? selectedProject.name : 'Overview'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setSelectedProjectId(null)}><span className="brand-mark">D</span><span>devtask<span className="brand-ai">.ai</span></span></a>
        <div className="workspace"><span className="workspace-avatar">W</span><span><b>My workspace</b><small>Personal</small></span><i>⌄</i></div>
        <nav aria-label="Main navigation">
          <button className={`nav-link ${selectedProjectId === null ? 'active' : ''}`} onClick={() => setSelectedProjectId(null)}><span>◫</span>Overview</button>
          <button className={`nav-link ${selectedProjectId !== null ? 'active' : ''}`} onClick={() => setSelectedProjectId(null)}><span>▦</span>Projects</button>
          <a className="nav-link" href="#tasks"><span>☷</span>My tasks</a>
        </nav>
        <div className="sidebar-projects"><div className="sidebar-heading">YOUR PROJECTS <button aria-label="Add project" onClick={() => setShowProjectForm(true)}>＋</button></div>
          {projects.map((project) => <button className={`project-nav ${selectedProjectId === project.id ? 'selected' : ''}`} key={project.id} onClick={() => setSelectedProjectId(project.id)}><span className={`dot ${projectColor(project.id)}`} />{project.name}</button>)}
          {!loading && projects.length === 0 && <span className="sidebar-empty">No projects yet</span>}
        </div>
        <div className="sidebar-bottom"><a className="nav-link" href="#settings"><span>⚙</span>Settings</a><div className="profile"><span className="profile-avatar">ME</span><span><b>Workspace member</b><small>Free plan</small></span><button className="logout-button" onClick={() => { authSession.clear(); setAuthenticated(false) }}>Log out</button></div></div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>{projectLabel}</b></div><div className="top-actions"><button aria-label="Search">⌕</button><button aria-label="Notifications">♧</button><span className="top-avatar">ME</span></div></header>
        <div className="page-content">
          {error && <div className="notice error-notice" role="alert"><span>{error}</span><button onClick={() => void loadWorkspace()}>Retry</button></div>}
          {selectedProject ? (
            <>
              <section className="welcome"><div><p className="eyebrow">PROJECT</p><h1>{selectedProject.name}</h1><p className="muted">{selectedProject.description || 'Tasks and progress for this project.'}</p></div><div className="welcome-actions"><button className="secondary-button" onClick={() => void deleteProject()}>Delete project</button><button className="primary-button" onClick={() => setShowTaskForm((shown) => !shown)}>＋ &nbsp;New task</button></div></section>
              <section className="stats" aria-label="Project summary">
                <article><span>Total tasks</span><strong>{selectedProject.taskCount}</strong><small>in this project</small><i className="purple">☷</i></article>
                <article><span>Open tasks</span><strong>{Math.max(0, selectedProject.taskCount - selectedProject.completedTaskCount)}</strong><small>still to do</small><i className="green">◷</i></article>
                <article><span>Progress</span><strong>{selectedProject.taskCount ? Math.round(selectedProject.completedTaskCount / selectedProject.taskCount * 100) : 0}%</strong><small>tasks completed</small><i className="amber">✓</i></article>
              </section>
              {showTaskForm && <form className="inline-form task-form" onSubmit={(event) => void createTask(event)}><h2>Add a task</h2><label>Title<input name="title" required minLength={2} maxLength={160} autoFocus placeholder="What needs to get done?" /></label><label>Description<input name="description" maxLength={2000} placeholder="Optional details" /></label><div className="form-row"><label>Priority<select name="priority" defaultValue="Medium"><option>Low</option><option>Medium</option><option>High</option></select></label><label>Due date<input name="dueDate" type="date" /></label></div><div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowTaskForm(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Add task'}</button></div></form>}
              <section className="section tasks-section" id="tasks"><div className="section-title"><div><h2>Project tasks</h2><p>Update task status or remove completed work.</p></div></div>
                {loading ? <div className="empty-state">Loading tasks…</div> : projectTasks.length === 0 ? <div className="empty-state"><strong>No tasks yet</strong><span>Add the first task to start tracking progress.</span><button className="primary-button" onClick={() => setShowTaskForm(true)}>＋ &nbsp;Add task</button></div> : <div className="task-list">{projectTasks.map((task) => <article className="task-row" key={task.id}><span className={`task-check ${task.status === 'Done' ? 'done' : task.status === 'InProgress' ? 'working' : ''}`}>{task.status === 'Done' ? '✓' : ''}</span><div className="task-copy"><b>{task.title}</b><small>{task.description || `${task.priority} priority${task.dueDate ? ` · Due ${new Date(`${task.dueDate}T00:00:00`).toLocaleDateString()}` : ''}`}</small></div><select aria-label={`Status for ${task.title}`} className={`status-select ${task.status.toLowerCase()}`} value={task.status} onChange={(event) => void changeTaskStatus(task, event.target.value as TaskStatus)}>{statusOrder.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}</select><button className="delete-task" aria-label={`Delete ${task.title}`} onClick={() => void deleteTask(task)}>×</button></article>)}</div>}
              </section>
            </>
          ) : (
            <>
              <section className="welcome"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>Welcome back <span>✳</span></h1><p className="muted">Here's what's happening across your projects.</p></div><button className="primary-button" onClick={() => setShowProjectForm(true)}>＋ &nbsp;New project</button></section>
              <section className="stats" aria-label="Workspace summary"><article><span>Active projects</span><strong>{projects.length}</strong><small>across your workspace</small><i className="purple">▦</i></article><article><span>Open tasks</span><strong>{openTaskCount}</strong><small>across all projects</small><i className="green">☷</i></article><article><span>Completed tasks</span><strong>{completedTaskCount}</strong><small>across all projects</small><i className="amber">✓</i></article></section>
              <section className="section" id="projects"><div className="section-title"><div><h2>Your projects</h2><p>Keep track of the work that matters.</p></div></div>
                {loading ? <div className="empty-state">Loading projects…</div> : projects.length === 0 ? <div className="empty-state"><strong>No projects yet</strong><span>Create a project to start organizing work and tasks.</span><button className="primary-button" onClick={() => setShowProjectForm(true)}>＋ &nbsp;Create project</button></div> : <div className="project-grid">{projects.map((project) => { const progress = project.taskCount ? Math.round(project.completedTaskCount / project.taskCount * 100) : 0; return <button className="project-card" key={project.id} onClick={() => setSelectedProjectId(project.id)}><div className="project-card-top"><span className={`project-icon ${projectColor(project.id)}`}>▦</span><span className="project-open">Open →</span></div><h3>{project.name}</h3><p>{project.description || `${project.taskCount} ${project.taskCount === 1 ? 'task' : 'tasks'}`}</p><div className="progress"><span className={projectColor(project.id)} style={{ width: `${progress}%` }} /></div><div className="project-footer"><span>{progress}% complete</span><span>{project.completedTaskCount} / {project.taskCount} tasks</span></div></button> })}</div>}
              </section>
              <section className="section tasks-section" id="tasks"><div className="section-title"><div><h2>Recent tasks</h2><p>A quick look at what's moving.</p></div></div>{recentTasks.length === 0 ? <div className="task-list empty-list"><span>Your latest tasks will appear here.</span></div> : <div className="task-list">{recentTasks.map((task) => <article className="task-row" key={task.id}><span className={`task-check ${task.status === 'Done' ? 'done' : task.status === 'InProgress' ? 'working' : ''}`}>{task.status === 'Done' ? '✓' : ''}</span><div className="task-copy"><b>{task.title}</b><small>{projects.find((project) => project.id === task.projectId)?.name}</small></div><span className={`status-text ${task.status.toLowerCase()}`}>{statusLabels[task.status]}</span><button className="open-project" onClick={() => setSelectedProjectId(task.projectId)}>View</button></article>)}</div>}</section>
            </>
          )}
          <p className="demo-note">DevTask AI · V1</p>
        </div>
      </main>

      {showProjectForm && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowProjectForm(false) }}><form className="modal-card" role="dialog" aria-modal="true" aria-labelledby="project-form-title" onSubmit={(event) => void createProject(event)}><button type="button" className="modal-close" aria-label="Close" onClick={() => setShowProjectForm(false)}>×</button><p className="eyebrow">NEW PROJECT</p><h2 id="project-form-title">Create a project</h2><p className="modal-description">Give your work a name. You can add tasks right after.</p><label>Project name<input name="name" required minLength={2} maxLength={120} autoFocus placeholder="e.g. Website redesign" /></label><label>Description <span className="optional">Optional</span><textarea name="description" maxLength={2000} rows={3} placeholder="What is this project about?" /></label><div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowProjectForm(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Creating…' : 'Create project'}</button></div></form></div>}
    </div>
  )
}

export default App
