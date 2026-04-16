/**
 * Uso (desde la carpeta WorkHub_Backend, con DATABASE_URL en .env):
 *   node scripts/set-user-password.js <correo> <contraseña>
 *
 * Asigna o reemplaza el password_hash en BD sin pasar por la API.
 * Útil para el primer administrador antes de poder usar POST /api/admin/assign-password.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const ModeloUsuario = require('../src/models/modeloUsuario');

const BCRYPT_ROUNDS = 12;

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Uso: node scripts/set-user-password.js <correo> <contraseña>');
    process.exit(1);
  }

  const user = await ModeloUsuario.encontralPorMail(email.trim());
  if (!user) {
    const e = email.trim();
    console.error(`No existe ninguna fila en "Usuario" con correo_institucional = "${e}".`);
    console.error(
      'ADMIN_EMAILS solo autoriza la API; el correo tiene que existir primero en la tabla "Usuario".'
    );
    console.error(
      'Opciones: (1) INSERT en Neon para ese correo, o (2) usar npm run set-user-password con un correo que ya esté en la tabla.'
    );
    console.error(
      'Ejemplo en Neon (ajusta nombre/apellido):\n' +
        `  INSERT INTO "Usuario" (nombre, apellido, correo_institucional) VALUES ('Admin', 'Sistema', '${e}');`
    );
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await ModeloUsuario.actualizarPasswordHash(user.id_usuario, hash);
  console.log('Contraseña actualizada para:', email.trim());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
