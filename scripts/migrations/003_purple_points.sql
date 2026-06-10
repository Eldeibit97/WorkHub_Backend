-- Purple Points: saldo, ledger de transacciones, inventario y equipamiento activo.
-- Ejecutar una vez en Neon antes de habilitar /api/purple-points.

-- Saldo actual del usuario (fuente de verdad para mostrar balance rápido)
CREATE TABLE IF NOT EXISTS public."Usuario_Purple_Points" (
  id_usuario     INT PRIMARY KEY REFERENCES public."Usuario"(id_usuario),
  saldo          INT NOT NULL DEFAULT 0 CHECK (saldo >= 0),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ledger de transacciones (permite auditoría e idempotencia de ganancias)
CREATE TABLE IF NOT EXISTS public."Purple_Points_Transaccion" (
  id_transaccion SERIAL PRIMARY KEY,
  id_usuario     INT NOT NULL REFERENCES public."Usuario"(id_usuario),
  tipo           VARCHAR(20) NOT NULL,
  monto          INT NOT NULL,
  id_reserva     INT REFERENCES public."Reserva"(id_reserva),
  item_id        VARCHAR(64),
  descripcion    TEXT,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_pp_tipo CHECK (tipo IN (
    'EARN_CREATE',
    'EARN_CHECKOUT',
    'PURCHASE',
    'ADMIN_ADJUST'
  ))
);

-- Índice de consulta por usuario (historial reciente primero)
CREATE INDEX IF NOT EXISTS idx_pp_transaccion_usuario
  ON public."Purple_Points_Transaccion" (id_usuario, creado_en DESC);

-- Índice secundario para lookup por reserva
CREATE INDEX IF NOT EXISTS idx_pp_transaccion_reserva
  ON public."Purple_Points_Transaccion" (id_reserva, tipo);

-- Índice único parcial: garantiza idempotencia de EARN_CREATE y EARN_CHECKOUT
-- Una reserva solo puede generar una transacción de cada tipo
CREATE UNIQUE INDEX IF NOT EXISTS idx_pp_trans_reserva_tipo
  ON public."Purple_Points_Transaccion" (id_reserva, tipo)
  WHERE id_reserva IS NOT NULL;

-- Inventario: ítems adquiridos por el usuario en el Mercado
CREATE TABLE IF NOT EXISTS public."Usuario_Inventario" (
  id_usuario  INT NOT NULL REFERENCES public."Usuario"(id_usuario),
  item_id     VARCHAR(64) NOT NULL,
  categoria   VARCHAR(20) NOT NULL,
  comprado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_usuario, item_id),
  CONSTRAINT chk_inv_categoria CHECK (categoria IN ('theme', 'avatar', 'banner'))
);

-- Equipamiento activo del usuario (upsert en cada cambio de tema/avatar/banner)
CREATE TABLE IF NOT EXISTS public."Usuario_Equipamiento" (
  id_usuario     INT PRIMARY KEY REFERENCES public."Usuario"(id_usuario),
  tema_id        VARCHAR(64),
  avatar_id      VARCHAR(64),
  banner_id      VARCHAR(64),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
