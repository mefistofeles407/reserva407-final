import { useEffect, useState } from 'react'
import { puedeCancelar } from '../../domain/reservas'
import { api } from '../../data/api'

export function ConsultaReserva({ reservas, confirmacion, onInicio, onCancelar, onReembolso, onReclamar }) {
  const [codigo, setCodigo] = useState(confirmacion?.codigo ?? '')
  const [contacto, setContacto] = useState(confirmacion?.contacto ?? '')
  const [consulta, setConsulta] = useState(confirmacion)
  const [resultado, setResultado] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [ahora, setAhora] = useState(Date.now)
  const reserva = consulta && (consulta.propia
    ? reservas.find(item => item.codigo === consulta.codigo)
    : resultado?.consulta === consulta ? resultado.reserva : null)
  const creadaEn = reserva?.creadaEn

  useEffect(() => {
    if (!consulta || consulta.propia) return
    const control = new AbortController()
    async function buscar() {
      const datos = await api('consultar', consulta, control.signal)
      if (!control.signal.aborted) setResultado({ ...datos, consulta })
    }
    buscar()
    const reloj = setInterval(buscar, 3000)
    return () => {
      control.abort()
      clearInterval(reloj)
    }
  }, [consulta])

  useEffect(() => {
    const vence = Date.parse(creadaEn) + 15 * 60_000
    if (!(vence >= Date.now())) return
    const reloj = setTimeout(() => setAhora(Date.now()), vence - Date.now() + 1)
    return () => clearTimeout(reloj)
  }, [creadaEn])

  async function ejecutar(accion) {
    setOcupado(true)
    try {
      const cambio = await accion(reserva.codigo, consulta.contacto)
      if (cambio.ok && !consulta.propia) setConsulta(actual => actual === consulta ? { ...consulta } : actual)
    } finally {
      setOcupado(false)
    }
  }

  return <section className="panel">
    <div className="section-heading">
      <div><span className="eyebrow">Gestión privada</span><h2>Consultar reserva</h2></div>
      <button className="link" onClick={onInicio}>Inicio</button>
    </div>
    <form className="search-row" onSubmit={e => {
      e.preventDefault()
      setAhora(Date.now())
      setConsulta({ codigo, contacto })
    }}>
      <label>Código de reserva<input required value={codigo} onChange={e => { setCodigo(e.target.value); setConsulta(null) }} /></label>
      <label>Correo o teléfono<input required value={contacto} onChange={e => { setContacto(e.target.value); setConsulta(null) }} /></label>
      <button className="primary" disabled={ocupado || !codigo.trim() || !contacto.trim()}>Buscar</button>
    </form>
    {reservas.length > 0 && <label>Mis reservas
      <select value={consulta?.propia ? consulta.codigo : ''} onChange={e => {
        setAhora(Date.now())
        setConsulta(e.target.value ? { codigo: e.target.value, propia: true } : null)
      }}>
        <option value="">Selecciona una reserva</option>
        {reservas.map(item => <option key={item.codigo} value={item.codigo}>{item.codigo} · {item.fecha} · {item.estado}</option>)}
      </select>
    </label>}
    {reserva && <article className="reservation-card">
      <span className={`badge ${reserva.estado.toLowerCase()}`}>{reserva.estado}</span>
      <h3>{reserva.codigo}</h3>
      <dl>
        <div><dt>Fecha y hora</dt><dd>{reserva.fecha} · {reserva.hora}</dd></div>
        <div><dt>Ambiente</dt><dd>{reserva.ambiente}</dd></div>
        <div><dt>Mesas</dt><dd>{reserva.mesas.join(' + ')}</dd></div>
        <div><dt>Adelanto</dt><dd>S/{reserva.adelanto}</dd></div>
      </dl>
      <div className="actions">
        {reserva.estado === 'Activa' && <button className="danger"
          disabled={ocupado || !puedeCancelar(reserva, ahora)} onClick={() => ejecutar(onCancelar)}>Cancelar reserva</button>}
        {reserva.estado === 'Cancelada' && reserva.reembolso === 'Disponible' && <button className="primary"
          disabled={ocupado} onClick={() => ejecutar(onReembolso)}>Solicitar reembolso</button>}
        <button className="secondary" onClick={() => onReclamar(reserva.codigo)}>Quejas / Reclamaciones</button>
      </div>
      {reserva.estado === 'Activa' && !puedeCancelar(reserva, ahora) &&
        <p className="notice">La cancelación en línea requiere estar dentro de los 15 minutos desde la creación.</p>}
      {reserva.estado === 'No presentado' &&
        <p className="notice">Terminó la tolerancia de llegada. El adelanto no es reembolsable.</p>}
      {reserva.reembolso && <p className="notice">Reembolso <strong>{reserva.reembolso}</strong></p>}
    </article>}
    {consulta && !consulta.propia && resultado?.consulta !== consulta &&
      <p className="empty" role="status">Buscando reserva…</p>}
    {consulta && resultado?.consulta === consulta && !resultado.ok &&
      <p className="empty" role="status">{resultado.mensaje}</p>}
  </section>
}
