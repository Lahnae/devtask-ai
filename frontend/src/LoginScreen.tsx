import { useState, type FormEvent } from 'react'
import { api, authSession } from './api'
import './LoginScreen.css'

type Props = { onLogin: () => void }

export default function LoginScreen({ onLogin }: Props) {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    setError('')
    try {
      const result = await api.login(String(form.get('username') ?? ''), String(form.get('password') ?? ''))
      authSession.save(result.accessToken, result.expiresAt)
      onLogin()
    } catch {
      setError('Kirjautuminen epäonnistui. Tarkista käyttäjätunnus ja salasana.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={(event) => void submit(event)}>
        <a className="login-brand" href="#overview"><span className="brand-mark">D</span><span>devtask<span className="brand-ai">.ai</span></span></a>
        <p className="login-eyebrow">PRIVATE WORKSPACE</p>
        <h1>Welcome back</h1>
        <p className="login-description">Sign in to continue to your workspace.</p>
        <label>Username<input name="username" autoComplete="username" required autoFocus /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="primary-button login-submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  )
}
