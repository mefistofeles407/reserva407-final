import { useState } from 'react'
import './App.css'
import { seleccionInicial } from './data/initialData'
import { hoy } from './domain/reservas'
import { useAppData } from './hooks/useAppData'
import { Header } from './shared/Header'
import { AlertMessage } from './shared/AlertMessage'
import { AccesoForm } from './shared/AccesoForm'
import { ClienteInicio } from './features/cliente/ClienteInicio'
import { ReservaForm } from './features/cliente/ReservaForm'
import { ConsultaReserva } from './features/cliente/ConsultaReserva'
import { ReclamacionForm } from './features/cliente/ReclamacionForm'
import { AdminDashboard } from './features/admin/AdminDashboard'

const nuevaSeleccion = usuario => ({
  ...seleccionInicial, fecha: hoy(),
  ...(usuario?.rol === 'cliente' ? { nombre: usuario.nombre, correo: usuario.correo, telefono: usuario.telefono } : {}),
})

export default function App() {
  const [vista, setVista] = useState('inicio')
  const [mensaje, setMensaje] = useState('')
  const [seleccion, setSeleccion] = useState(() => nuevaSeleccion())
  const [confirmacion, setConfirmacion] = useState(null)
  const [codigoReclamo, setCodigoReclamo] = useState('')
  const datos = useAppData(setMensaje)
  const admin = datos.user?.rol === 'admin'

  function navegar(destino) {
    setMensaje('')
    setConfirmacion(null)
    setVista(destino)
  }

  async function confirmar() {
    const resultado = await datos.crearReserva(seleccion)
    if (!resultado.ok) return
    setConfirmacion({ codigo: resultado.codigo, contacto: seleccion.correo.trim() || seleccion.telefono.trim() })
    setSeleccion(nuevaSeleccion(datos.user))
    setVista(actual => actual === 'reserva' ? 'consulta' : actual)
  }

  function reclamar(codigo = '') {
    setCodigoReclamo(codigo)
    setVista('reclamacion')
  }

  async function autenticar(accion, cuerpo) {
    const resultado = await datos.autenticar(accion, cuerpo)
    if (resultado.ok) {
      setConfirmacion(null)
      setCodigoReclamo('')
      setSeleccion(nuevaSeleccion(resultado.usuario))
      setVista(resultado.usuario?.rol === 'admin' ? 'admin' : 'inicio')
    }
    return resultado
  }

  return <div className="app-shell">
    <Header rol={vista === 'admin' ? 'admin' : 'cliente'} usuario={datos.user}
      onInicio={() => navegar('inicio')} onCliente={() => navegar('inicio')} onAdmin={() => navegar('admin')}
      onAcceso={navegar} onSalir={() => autenticar('logout', {})} />
    <main>
      <AlertMessage mensaje={mensaje} onClose={() => setMensaje('')} />
      {datos.cargando && <p role="status">Cargando datos de Reserva407…</p>}
      {datos.errorConexion && <p className="error-text" role="alert">{datos.errorConexion}</p>}
      {vista === 'inicio' && <ClienteInicio onReservar={() => {
        setSeleccion(nuevaSeleccion(datos.user))
        navegar('reserva')
      }} onConsultar={() => navegar('consulta')} onReclamar={() => reclamar()} />}
      {vista === 'reserva' && <ReservaForm seleccion={seleccion} setSeleccion={setSeleccion}
        disponible={datos.disponible} mesas={datos.mesas} onConfirmar={confirmar} onVolver={() => navegar('inicio')} />}
      {vista === 'consulta' && <ConsultaReserva key={datos.user?.id ?? 'visitante'}
        reservas={admin ? [] : datos.reservas} confirmacion={confirmacion}
        onInicio={() => navegar('inicio')} onCancelar={datos.cancelarReserva}
        onReembolso={datos.solicitarReembolso} onReclamar={reclamar} />}
      {vista === 'reclamacion' && <ReclamacionForm reservaInicial={codigoReclamo} onEnviar={datos.enviarReclamacion}
        onVolver={() => setVista(codigoReclamo ? 'consulta' : 'inicio')} />}
      {['registro', 'login'].includes(vista) && <AccesoForm key={vista} tipo={vista}
        onEnviar={autenticar} onVolver={() => navegar('inicio')} />}
      {vista === 'admin' && !admin && !datos.cargando && <AccesoForm tipo="admin"
        onEnviar={autenticar} onVolver={() => navegar('inicio')} />}
      {vista === 'admin' && admin && <AdminDashboard reservas={datos.reservas} mesas={datos.mesas}
        reclamaciones={datos.reclamaciones} actions={datos} onSalir={() => autenticar('logout', {})} />}
    </main>
    <footer>Reserva407 · Desarrollo de Interfaces 2</footer>
  </div>
}
