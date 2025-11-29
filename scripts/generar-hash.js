const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.log('Uso: node scripts/generar-hash.js <password>');
  console.log('Ejemplo: node scripts/generar-hash.js miPassword123');
  process.exit(1);
}

bcrypt.hash(password, 10).then(hash => {
  console.log('\nHash generado:');
  console.log(hash);
  console.log('\nCopia este valor en tu .env como ADMIN_PASSWORD_HASH');
});
