# Reserva407

Proyecto académico de Desarrollo de Interfaces 2. React, JavaScript y Vite muestran la aplicación. La API PHP de Apache gestiona la sesión y las operaciones. MariaDB de XAMPP guarda los datos.

## Inicio local en Windows

1. Inicia Apache en el puerto 80 y MariaDB de XAMPP en el puerto **3307**. La conexión PHP apunta a `127.0.0.1:3307/reserva407`. Si usas phpMyAdmin, selecciona la instancia de XAMPP en 3307.
2. Crea la base `reserva407` con colación `utf8mb4_general_ci` si aún no existe. Desde esa base en phpMyAdmin, importa [database/reserva407.sql](database/reserva407.sql). Crea las tablas, las 18 mesas de Principal, VIP y Terraza y la cuenta académica. El script puede volver a importarse sin reemplazar mesas ni cuentas existentes.
3. Copia los tres archivos de [backend](backend) a `C:\xampp\htdocs\Reserva407\`. Actualiza esa copia cada vez que cambie el backend del proyecto. `bootstrap.php` centraliza la configuración de la base para este entorno local. Abre `http://127.0.0.1/Reserva407/index.php` para comprobar que la API devuelve JSON.
4. Con Node.js 20.19 o posterior compatible con Vite, abre una terminal en el proyecto y ejecuta:

   ```powershell
   npm.cmd install
   npm.cmd run dev
   ```

5. Abre la URL de Vite que aparezca en la terminal, normalmente `http://127.0.0.1:5173`. Vite reenvía las solicitudes de API a Apache. La sesión usa una cookie HTTP-only del mismo origen. Usa la misma URL durante toda la prueba.

## Cuentas y reservas

- **Cliente.** Registra nombre, correo, teléfono y contraseña de al menos 8 caracteres. El registro inicia sesión. La opción **Mis reservas** aparece en la consulta cuando la cuenta tiene reservas asociadas. También puedes reservar como visitante y consultar con el código y el correo o teléfono de la reserva.
- **Administración.** Usa `admin@reserva407.pe` y `admin123` desde la pestaña Administración. Es una cuenta exclusivamente académica. PHP comprueba el hash y el rol antes de permitir operaciones administrativas.
- **Turnos.** 12:00, 13:00, 14:00 y 15:00. El adelanto simulado es de S/100 por mesa. La disponibilidad se vuelve a comprobar dentro de la transacción que crea o reasigna una reserva.
- **Cancelación y reembolso.** El cliente dispone de 15 minutos desde la creación. Después de una cancelación elegible se puede solicitar el reembolso para procesamiento administrativo.
- **No presentado.** La API revisa las reservas al leer o modificar los datos. La app abierta actualiza el estado periódicamente. Si la app está cerrada, la transición se registra en la siguiente operación de la API. La tolerancia se calcula en hora de Lima.

## Persistencia

MariaDB es la fuente de verdad para usuarios, reservas, mesas, reclamaciones y reembolsos. Los reembolsos se representan como estado de la reserva. La relación entre reservas y mesas se guarda en `reserva_mesas`. La consulta pública de disponibilidad devuelve turnos y mesas, sin nombres, contactos ni códigos de otras reservas.

El navegador ya no lee ni escribe `reserva407-datos` ni las tres claves de la versión anterior. Los registros de prueba locales se dejan en el perfil original, fuera de la aplicación nueva. La base empieza con mesas y cuenta de demostración administrativa. Si quieres eliminar los datos antiguos del navegador, borra únicamente esas entradas de almacenamiento del sitio.

## Verificación

1. Registra una cuenta, intenta repetir el correo, cierra sesión y vuelve a entrar. Prueba también una contraseña incorrecta.
2. Confirma una reserva. Recarga y comprueba que aparece en **Mis reservas**. Prueba consultar el código con un contacto incorrecto desde otra cuenta.
3. Selecciona la misma mesa en dos pestañas antes de confirmar. Solo debe confirmarse un intento. En Administración, intenta reasignar una reserva a una mesa ya reservada en el mismo turno.
4. Cancela una reserva elegible, solicita el reembolso y procésalo desde Administración. Registra una reclamación y avánzala hasta Resuelta.
5. Ocupa, libera, bloquea y desbloquea una mesa. Comprueba el calendario por fecha, el estado No presentado después de la tolerancia y las pantallas a 320 y 1280 px.
6. Ejecuta las comprobaciones técnicas:

   ```powershell
   npm.cmd run lint
   npm.cmd run build
   Get-ChildItem backend -Filter *.php | ForEach-Object { & C:/xampp/php/php.exe -l $_.FullName }
   ```

El build genera `dist`. Para probarlo localmente con Apache activo, ejecuta `npm.cmd run preview`.

## Integrantes

- Amadeo Eusebio Moisés Cárdenas Palomino
- Integrante 2: completar
- Integrante 3: completar
