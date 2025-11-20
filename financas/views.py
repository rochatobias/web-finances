from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import DocumentoFinanceiro, Transacao
from .utilitarios_rag import processar_documento, consultar_rag, adicionar_transacao_rag
import json
from datetime import datetime

def index(request):
    """Renderiza a página principal."""
    return render(request, 'index.html')

@csrf_exempt
def enviar_arquivo(request):
    """Recebe e processa upload de arquivos financeiros (PDF/CSV)."""
    if request.method == 'POST' and request.FILES.get('arquivo'):
        arquivo = request.FILES['arquivo']
        documento = DocumentoFinanceiro.objects.create(arquivo=arquivo)
        
        sucesso, mensagem = processar_documento(documento.arquivo.path)
        
        documento.processado = sucesso
        documento.save()
        
        return JsonResponse({'sucesso': sucesso, 'mensagem': mensagem})
    
    return JsonResponse({'sucesso': False, 'mensagem': 'Nenhum arquivo recebido.'}, status=400)

@csrf_exempt
def nova_transacao(request):
    """Cria uma nova transação manual e indexa no sistema RAG."""
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido.'}, status=405)
    
    try:
        dados = json.loads(request.body)
        
        # Tratamento do valor (R$ 1.000,00 → 1000.00)
        valor_str = dados.get('valor', '0').replace('R$', '').replace('.', '').replace(',', '.').strip()
        valor_final = float(valor_str)
        
        # Tratamento da data (dd/mm/yyyy → yyyy-mm-dd)
        data_str = dados.get('data')
        data_final = datetime.strptime(data_str, '%d/%m/%Y').date()
        
        transacao = Transacao.objects.create(
            descricao=dados.get('nome_descricao'),
            categoria=dados.get('categoria'),
            valor=valor_final,
            data=data_final,
            tipo=dados.get('tipo')
        )
        
        adicionar_transacao_rag(transacao)
        
        return JsonResponse({'sucesso': True, 'mensagem': 'Transação salva e indexada!'})
    
    except ValueError as erro:
        return JsonResponse({'sucesso': False, 'mensagem': f'Formato inválido: {erro}'}, status=400)
    except Exception as erro:
        print(f"ERRO AO CRIAR TRANSAÇÃO: {erro}")
        return JsonResponse({'sucesso': False, 'mensagem': str(erro)}, status=500)

@csrf_exempt
def chat_api(request):
    """Processa perguntas do usuário via chatbot RAG."""
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método não permitido.'}, status=405)
    
    try:
        dados = json.loads(request.body)
        pergunta = dados.get('pergunta', '').strip()
        
        if not pergunta:
            return JsonResponse({'erro': 'Pergunta não fornecida.'}, status=400)
        
        resposta = consultar_rag(pergunta)
        return JsonResponse({'resposta': resposta})
    
    except Exception as erro:
        print(f"ERRO NO CHAT: {erro}")
        return JsonResponse({'erro': str(erro)}, status=500)
