-- Chat por piso: un foro = combinación (id_zona, fecha_chat). No requiere tabla propia.
-- Ejecutar una vez en Neon antes de habilitar la feature de chat por piso.

CREATE TABLE IF NOT EXISTS public."Chat_Mensaje" (
  id_mensaje     SERIAL PRIMARY KEY,
  id_zona        INT NOT NULL REFERENCES public."Zona"(id_zona),
  id_usuario     INT NOT NULL REFERENCES public."Usuario"(id_usuario),
  fecha_chat     DATE NOT NULL,
  tipo_contenido VARCHAR(10) NOT NULL,
  contenido      TEXT NOT NULL,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_chat_tipo CHECK (tipo_contenido IN ('text', 'emoji', 'gif'))
);

CREATE TABLE IF NOT EXISTS public."Chat_Lectura" (
  id_usuario        INT NOT NULL REFERENCES public."Usuario"(id_usuario),
  id_zona           INT NOT NULL REFERENCES public."Zona"(id_zona),
  fecha_chat        DATE NOT NULL,
  ultimo_mensaje_id INT REFERENCES public."Chat_Mensaje"(id_mensaje),
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_usuario, id_zona, fecha_chat)
);

CREATE INDEX IF NOT EXISTS idx_chat_mensaje_zona_fecha
  ON public."Chat_Mensaje" (id_zona, fecha_chat, creado_en DESC);
