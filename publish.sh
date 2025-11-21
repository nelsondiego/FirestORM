#!/bin/bash

# Script para publicar NDFirestORM en NPM
# Uso: ./publish.sh [patch|minor|major]

set -e

echo "🚀 Publicando NDFirestORM en NPM..."
echo ""

# Verificar que estamos en la rama correcta
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
    echo "⚠️  Advertencia: No estás en la rama main/master"
    read -p "¿Continuar de todos modos? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar que no haya cambios sin commitear
if [[ -n $(git status -s) ]]; then
    echo "❌ Error: Hay cambios sin commitear"
    echo "Por favor, commitea o descarta los cambios antes de publicar"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Ejecutar tests
echo "🧪 Ejecutando tests..."
npm test

# Compilar
echo "🔨 Compilando proyecto..."
npm run build

# Verificar que dist/ existe
if [ ! -d "dist" ]; then
    echo "❌ Error: La carpeta dist/ no existe"
    exit 1
fi

# Actualizar versión
VERSION_TYPE=${1:-patch}
echo "📝 Actualizando versión ($VERSION_TYPE)..."
npm version $VERSION_TYPE

# Obtener la nueva versión
NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ Nueva versión: $NEW_VERSION"

# Publicar
echo "📤 Publicando en NPM..."
npm publish --access public

# Push a GitHub
echo "⬆️  Subiendo cambios a GitHub..."
git push
git push --tags

echo ""
echo "🎉 ¡Publicado exitosamente!"
echo "📦 Paquete: ndfirestorm@$NEW_VERSION"
echo "🔗 NPM: https://www.npmjs.com/package/ndfirestorm"
echo "🔗 GitHub: https://github.com/nelsondiego/FirestORM"
echo ""
echo "Para instalar:"
echo "  npm install ndfirestorm"
