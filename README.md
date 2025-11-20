# Finanças AI - Chatbot Financeiro com RAG

Este projeto é um sistema de gerenciamento financeiro com capacidades de Inteligência Artificial (RAG - Retrieval-Augmented Generation). Ele permite que você faça upload de extratos bancários e converse com um assistente virtual para obter insights sobre seus gastos.

## Funcionalidades

- **Dashboard Financeiro**: Visualização rápida de receitas, despesas e saldo.
- **Upload de Extratos**: Suporte para arquivos PDF e CSV.
- **Chatbot Inteligente**: Pergunte sobre seus dados financeiros (ex: "Quanto gastei em restaurantes?").
- **Design Premium**: Interface moderna com tema escuro e glassmorphism.

## Tecnologias

- **Backend**: Django (Python)
- **Frontend**: HTML5, CSS3 (Premium), JavaScript
- **IA/RAG**: LangChain, ChromaDB, OpenAI/Google Gemini
- **Banco de Dados**: SQLite (Padrão Django)

## Como Rodar

1.  **Instalar Dependências**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Configurar Variáveis de Ambiente**:
    Crie um arquivo `.env` na raiz do projeto e adicione sua chave de API:
    ```env
    OPENAI_API_KEY=sua-chave-aqui
    # ou
    GOOGLE_API_KEY=sua-chave-aqui
    ```

3.  **Inicializar Banco de Dados**:
    ```bash
    python manage.py migrate
    ```

4.  **Rodar o Servidor**:
    ```bash
    python manage.py runserver
    ```

5.  **Acessar**:
    Abra `http://127.0.0.1:8000` no seu navegador.

## Estrutura do Projeto

- `config/`: Configurações do projeto Django.
- `financas/`: Aplicação principal contendo modelos, views e lógica RAG.
- `templates/`: Arquivos HTML.
- `static/`: Arquivos CSS e JS.
