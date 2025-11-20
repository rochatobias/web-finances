#!/bin/bash
# Criar ambiente virtual se não existir
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Ativar ambiente virtual
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Criar projeto Django chamado 'config' na pasta atual (se não existir)
if [ ! -f "manage.py" ]; then
    django-admin startproject config .
fi

# Criar app 'financas' (se não existir)
if [ ! -d "financas" ]; then
    python manage.py startapp financas
fi

# Criar pastas para templates e static se não existirem
mkdir -p templates
mkdir -p static/css
mkdir -p static/js
mkdir -p static/img

echo "Django setup complete."
