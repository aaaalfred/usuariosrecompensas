require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');

const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de sesión
app.use(session({
  secret: process.env.SESSION_SECRET || 'secreto_temporal',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 // 24 horas
  }
}));

// Variables globales para las vistas
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session && req.session.isAdmin;
  next();
});

// Rutas
app.use('/', authRoutes);
app.use('/usuarios', usuariosRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/usuarios');
  }
  res.redirect('/login');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
