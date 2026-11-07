USE reserva407;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(254) NOT NULL UNIQUE,
  telefono VARCHAR(32) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
  creadaEn DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS mesas (
  id CHAR(3) PRIMARY KEY,
  ambiente ENUM('Principal','VIP','Terraza') NOT NULL,
  bloqueada BOOLEAN NOT NULL DEFAULT FALSE,
  ocupada BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS reservas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(254) NOT NULL,
  telefono VARCHAR(32) NOT NULL,
  fecha DATE NOT NULL,
  hora ENUM('12:00','13:00','14:00','15:00') NOT NULL,
  ambiente ENUM('Principal','VIP','Terraza') NOT NULL,
  adelanto INT UNSIGNED NOT NULL,
  estado ENUM('Activa','Cancelada','No presentado','Finalizada') NOT NULL DEFAULT 'Activa',
  reembolso ENUM('Disponible','Pendiente','Procesado') NULL,
  creadaEn DATETIME(3) NULL,
  noPresentadoEn DATETIME(3) NULL,
  ocupacionObservadaEn DATETIME(3) NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX reservas_turno (estado,fecha,hora)
) ENGINE=InnoDB AUTO_INCREMENT=1027 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS reserva_mesas (
  reserva_id INT UNSIGNED NOT NULL,
  mesa_id CHAR(3) NOT NULL,
  PRIMARY KEY (reserva_id,mesa_id),
  FOREIGN KEY (reserva_id) REFERENCES reservas(id),
  FOREIGN KEY (mesa_id) REFERENCES mesas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS reclamaciones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT UNSIGNED NULL,
  reserva_codigo VARCHAR(32) NULL,
  asunto VARCHAR(160) NOT NULL,
  detalle TEXT NOT NULL,
  estado ENUM('Recibida','En revisión','Resuelta') NOT NULL DEFAULT 'Recibida',
  fecha DATE NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO usuarios (nombre,correo,telefono,password_hash,rol)
VALUES ('Administración demo','admin@reserva407.pe','','$2y$12$iNAaTI9ska.1H9ygP6ka/..fWRKjEzPN7OI9QH95z.Z/lPo4sM1tG','admin')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO mesas (id,ambiente,bloqueada) VALUES
 ('M01','Principal',0),('M02','Principal',1),('M03','Principal',0),('M04','Principal',0),
 ('M05','Principal',0),('M06','Principal',0),('M07','Principal',0),('M08','Principal',0),
 ('V01','VIP',0),('V02','VIP',0),('V03','VIP',0),('V04','VIP',0),
 ('T01','Terraza',0),('T02','Terraza',0),('T03','Terraza',0),
 ('T04','Terraza',0),('T05','Terraza',0),('T06','Terraza',0)
ON DUPLICATE KEY UPDATE id=id;
