import { useState } from 'react'

export function AccesoForm({ tipo, onEnviar, onVolver }) {
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const registro = tipo === 'registro'
  const admin = tipo === 'admin'
  const titulo = registro ? 'Registro' : admin ? 'Administración' : 'Iniciar sesión'

  async function enviar(evento) {
    evento.preventDefault()
    if (ocupado) return
    const campos = Object.fromEntries(new FormData(evento.currentTarget))
    setOcupado(true)
    setError('')
    try {
      const resultado = await onEnviar(registro ? 'registro' : 'login', {
        ...campos, rol: admin ? 'admin' : 'cliente',
      })
      if (!resultado.ok) setError(resultado.mensaje)
    } finally {
      setOcupado(false)
    }
  }

  return <section className="panel compact">
    <div className="section-heading">
      <h2>{titulo}</h2>
      <button className="link" onClick={onVolver} disabled={ocupado}>Volver</button>
    </div>
    <form onSubmit={enviar}>
      <fieldset className="stack" disabled={ocupado}>
        {registro && <>
          <label>Nombre<input name="nombre" autoComplete="name" required maxLength={120} /></label>
          <label>Teléfono<input name="telefono" type="tel" autoComplete="tel" required maxLength={32} /></label>
        </>}
        <label>Correo<input name="correo" type="email" autoComplete="email" required maxLength={254} /></label>
        <label>Contraseña<input name="clave" type="password" autoComplete={registro ? 'new-password' : 'current-password'}
          required minLength={registro ? 8 : undefined} maxLength={72} /></label>
        {error && <p className="error-text" role="alert">{error}</p>}
        <button className="primary">{ocupado ? 'Enviando…' : registro ? 'Crear cuenta' : 'Entrar'}</button>
      </fieldset>
    </form>
  </section>
}
