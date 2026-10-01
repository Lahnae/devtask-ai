import './App.css'

const projects = [
  { name: 'Website redesign', color: 'violet', total: 12, done: 8, due: 'Oct 18' },
  { name: 'Mobile app', color: 'blue', total: 9, done: 4, due: 'Oct 24' },
  { name: 'Marketing launch', color: 'orange', total: 7, done: 2, due: 'Nov 02' },
]

const tasks = [
  { name: 'Review homepage wireframes', project: 'Website redesign', status: 'In progress', tone: 'working' },
  { name: 'Set up the API project', project: 'Mobile app', status: 'To do', tone: 'todo' },
  { name: 'Prepare launch checklist', project: 'Marketing launch', status: 'Done', tone: 'done' },
]

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview"><span className="brand-mark">D</span><span>devtask<span className="brand-ai">.ai</span></span></a>
        <div className="workspace"><span className="workspace-avatar">W</span><span><b>My workspace</b><small>Personal</small></span><i>⌄</i></div>
        <nav aria-label="Main navigation">
          <a className="nav-link active" href="#overview"><span>◫</span>Overview</a>
          <a className="nav-link" href="#projects"><span>▦</span>Projects</a>
          <a className="nav-link" href="#tasks"><span>☷</span>My tasks</a>
        </nav>
        <div className="sidebar-projects"><div className="sidebar-heading">YOUR PROJECTS <button aria-label="Add project">＋</button></div>
          {projects.map((project) => <a className="project-nav" href="#projects" key={project.name}><span className={`dot ${project.color}`} />{project.name}</a>)}
        </div>
        <div className="sidebar-bottom"><a className="nav-link" href="#settings"><span>⚙</span>Settings</a><div className="profile"><span className="profile-avatar">ME</span><span><b>Workspace member</b><small>Free plan</small></span></div></div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>Overview</b></div><div className="top-actions"><button aria-label="Search">⌕</button><button aria-label="Notifications">♧</button><span className="top-avatar">VK</span></div></header>
        <div className="page-content">
          <section className="welcome"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>Welcome back <span>✳</span></h1><p className="muted">Here's what's happening across your projects.</p></div><button className="primary-button">＋ &nbsp;New project</button></section>
          <section className="stats" aria-label="Workspace summary">
            <article><span>Active projects</span><strong>3</strong><small>across your workspace</small><i className="purple">▦</i></article>
            <article><span>Open tasks</span><strong>18</strong><small className="green-text">↗ 4 this week</small><i className="green">☷</i></article>
            <article><span>Completed this week</span><strong>7</strong><small>tasks completed</small><i className="amber">✓</i></article>
          </section>
          <section className="section" id="projects"><div className="section-title"><div><h2>Your projects</h2><p>Keep track of the work that matters.</p></div><a href="#projects">View all →</a></div>
            <div className="project-grid">{projects.map((project) => { const progress = Math.round(project.done / project.total * 100); return <article className="project-card" key={project.name}><div className="project-card-top"><span className={`project-icon ${project.color}`}>▦</span><button aria-label={`More options for ${project.name}`}>•••</button></div><h3>{project.name}</h3><p>{project.done} of {project.total} tasks completed</p><div className="progress"><span className={project.color} style={{ width: `${progress}%` }} /></div><div className="project-footer"><span>{progress}% complete</span><span>Due {project.due}</span></div></article> })}</div>
          </section>
          <section className="section tasks-section" id="tasks"><div className="section-title"><div><h2>Recent tasks</h2><p>A quick look at what's moving.</p></div><a href="#tasks">View all →</a></div>
            <div className="task-list">{tasks.map((task) => <article className="task-row" key={task.name}><span className={`task-check ${task.tone}`}>{task.tone === 'done' ? '✓' : ''}</span><div className="task-copy"><b>{task.name}</b><small>{task.project}</small></div><span className={`status ${task.tone}`}>{task.status}</span><button aria-label={`More options for ${task.name}`}>•••</button></article>)}</div>
          </section>
          <p className="demo-note">Dashboard preview · sample data</p>
        </div>
      </main>
    </div>
  )
}

export default App
