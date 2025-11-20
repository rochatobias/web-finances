import os
from langchain_community.document_loaders import PyPDFLoader, CSVLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain.chains import RetrievalQA
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain_core.documents import Document
from dotenv import load_dotenv

load_dotenv()

# Configuração do Diretório de Persistência do Banco Vetorial
DIRETORIO_PERSISTENCIA = 'chroma_db'

def obter_embeddings():
    """
    Retorna o modelo de embeddings a ser utilizado.
    Usa um modelo local (HuggingFace) para evitar custos e limites de API.
    """
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

def obter_llm():
    """
    Retorna a instância do LLM (Large Language Model) configurada.
    Prioriza a Groq, mas tem fallback para OpenAI e Google.
    """
    if os.getenv("GROQ_API_KEY"):
        return ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
    elif os.getenv("OPENAI_API_KEY"):
        return ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
    elif os.getenv("GOOGLE_API_KEY"):
        return ChatGoogleGenerativeAI(model="models/gemini-1.5-flash-001", temperature=0)
    else:
        raise ValueError("Nenhuma chave de API encontrada. Configure GROQ_API_KEY (Recomendado), OPENAI_API_KEY ou GOOGLE_API_KEY.")

def processar_documento(caminho_arquivo):
    """
    Lê um arquivo (PDF ou CSV), divide em trechos menores e salva no banco vetorial (ChromaDB).
    
    Args:
        caminho_arquivo (str): Caminho absoluto para o arquivo.
        
    Returns:
        tuple: (bool, str) indicando sucesso/falha e uma mensagem.
    """
    extensao = os.path.splitext(caminho_arquivo)[1].lower()
    
    if extensao == '.pdf':
        carregador = PyPDFLoader(caminho_arquivo)
        documentos = carregador.load()
    elif extensao == '.csv':
        carregador = CSVLoader(caminho_arquivo)
        documentos = carregador.load()
    else:
        return False, "Formato de arquivo não suportado."

    # Divisão do texto em chunks para melhor processamento pelo RAG
    divisor_texto = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    textos = divisor_texto.split_documents(documentos)

    embeddings = obter_embeddings()
    
    # Inicializa e popula o banco vetorial
    db = Chroma(persist_directory=DIRETORIO_PERSISTENCIA, embedding_function=embeddings)
    db.add_documents(textos)
    
    return True, f"Processados {len(textos)} trechos de texto com sucesso."

def consultar_rag(pergunta):
    """
    Realiza uma consulta no sistema RAG (Retrieval-Augmented Generation).
    Busca documentos relevantes no banco vetorial e usa o LLM para gerar uma resposta.
    
    Args:
        pergunta (str): A pergunta do usuário.
        
    Returns:
        str: A resposta gerada pelo assistente.
    """
    embeddings = obter_embeddings()
    db = Chroma(persist_directory=DIRETORIO_PERSISTENCIA, embedding_function=embeddings)
    
    # Template de Prompt em Português
    template = """Você é um assistente financeiro pessoal altamente qualificado. 
    Use os seguintes trechos de extratos bancários e transações para responder à pergunta do usuário de forma clara e útil.
    Se a informação não estiver nos documentos, diga honestamente que não encontrou os dados.
    
    Contexto Financeiro:
    {context}
    
    Pergunta do Usuário: {question}
    
    Resposta:"""
    
    prompt_qa = PromptTemplate.from_template(template)
    
    # Configura o recuperador (retriever)
    recuperador = db.as_retriever(search_kwargs={"k": 10})
    llm = obter_llm()
    
    # Debug: Imprime no terminal o que foi recuperado (opcional, bom para desenvolvimento)
    docs = recuperador.invoke(pergunta)
    print(f"--- DOCS RECUPERADOS ({len(docs)}) ---")
    for i, doc in enumerate(docs):
        print(f"Doc {i+1}: {doc.page_content[:150]}...")
    print("-----------------------------------")
    
    # Cria a cadeia de QA (Question Answering)
    cadeia_qa = RetrievalQA.from_chain_type(
        llm=llm, 
        chain_type="stuff", 
        retriever=recuperador,
        chain_type_kwargs={"prompt": prompt_qa}
    )
    
    # Executa a consulta
    resposta = cadeia_qa.invoke({"query": pergunta})
    return resposta.get('result', resposta)

def adicionar_transacao_rag(transacao):
    """
    Adiciona uma única transação manual ao ChromaDB como um documento de texto.
    Isso permite que o RAG "saiba" sobre transações manuais imediatamente.
    
    Args:
        transacao (Transacao): Objeto do modelo Transacao.
        
    Returns:
        bool: True se sucesso.
    """
    texto_transacao = (
        f"Transação Manual: {transacao.descricao}\n"
        f"Valor: R$ {transacao.valor}\n"
        f"Data: {transacao.data}\n"
        f"Categoria: {transacao.categoria}\n"
        f"Tipo: {transacao.tipo}"
    )
    
    embeddings = obter_embeddings()
    db = Chroma(persist_directory=DIRETORIO_PERSISTENCIA, embedding_function=embeddings)
    
    doc = Document(page_content=texto_transacao, metadata={"origem": "manual", "id": transacao.id})
    
    db.add_documents([doc])
    return True
