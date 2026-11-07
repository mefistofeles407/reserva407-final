export function Header({ rol, usuario, onCliente, onAdmin, onInicio, onAcceso, onSalir }) {
  return <header className="topbar">
    <button className="brand" onClick={onInicio}>Reserva407</button>
    <nav aria-label="Modo de la aplicación">
      <button aria-pressed={rol === 'cliente'} className={rol === 'cliente' ? 'active' : ''} onClick={onCliente}>Cliente</button>
      <button aria-pressed={rol === 'admin'} className={rol === 'admin' ? 'active' : ''} onClick={onAdmin}>Administración</button>
      {usuario ? rol !== 'admin' && <button onClick={onSalir}>Cerrar sesión</button> : <>
        <button onClick={() => onAcceso('registro')}>Registro</button>
        <button onClick={() => onAcceso('login')}>Iniciar sesión</button>
      </>}
    </nav>
  </header>
}
