from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='inicio'),
    path('api/enviar-arquivo/', views.enviar_arquivo, name='enviar_arquivo'),
    path('api/nova-transacao/', views.nova_transacao, name='nova_transacao'),
    path('api/chat/', views.chat_api, name='chat_api'),
]
