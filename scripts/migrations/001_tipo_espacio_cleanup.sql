-- Migra tipos legacy Phone Booth (3) y Media Scape (4) a Área especial (5).
-- Ejecutar una vez en Neon antes de usar el editor de pisos en producción.

UPDATE public."Espacio"
   SET id_tipo_espacio = 5
 WHERE id_tipo_espacio IN (3, 4);

DELETE FROM public."Tipo_Espacio"
 WHERE id_tipo_espacio IN (3, 4);
