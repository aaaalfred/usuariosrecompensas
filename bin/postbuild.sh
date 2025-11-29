#!/bin/bash

# Limpiar directorio de hosting anterior
rm -rf .amplify-hosting

# Crear estructura de directorios de Amplify
mkdir -p .amplify-hosting/compute/default
mkdir -p .amplify-hosting/static/public

# Copiar archivos de la aplicación al directorio de compute
cp -r app.js .amplify-hosting/compute/default/
cp -r package.json .amplify-hosting/compute/default/
cp -r package-lock.json .amplify-hosting/compute/default/
cp -r config .amplify-hosting/compute/default/
cp -r middleware .amplify-hosting/compute/default/
cp -r routes .amplify-hosting/compute/default/
cp -r views .amplify-hosting/compute/default/

# Instalar solo dependencias de producción en el directorio de compute
cd .amplify-hosting/compute/default
npm ci --omit=dev
cd ../../..

# Copiar archivos estáticos (si existieran)
if [ -d "public" ]; then
  cp -r public/* .amplify-hosting/static/public/
fi

# Copiar el manifiesto de despliegue
cp deploy-manifest.json .amplify-hosting/

echo "Build completado para Amplify Hosting"
