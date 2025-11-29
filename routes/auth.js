const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// GET /login - Mostrar formulario de login
router.get('/login', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/usuarios');
  }
  res.render('login', { error: null });
});

// POST /login - Procesar login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const adminUser = process.env.ADMIN_USER;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminUser || !adminPasswordHash) {
    return res.render('login', { error: 'Configuración de admin no encontrada' });
  }

  if (username !== adminUser) {
    return res.render('login', { error: 'Credenciales incorrectas' });
  }

  try {
    const match = await bcrypt.compare(password, adminPasswordHash);

    if (match) {
      req.session.isAdmin = true;
      req.session.username = username;
      return res.redirect('/usuarios');
    } else {
      return res.render('login', { error: 'Credenciales incorrectas' });
    }
  } catch (err) {
    console.error('Error en login:', err);
    return res.render('login', { error: 'Error al procesar login' });
  }
});

// GET /logout - Cerrar sesión
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
    }
    res.redirect('/login');
  });
});

module.exports = router;
