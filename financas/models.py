from django.db import models

class Transacao(models.Model):
    TIPO_CHOICES = [
        ('Receita', 'Receita'),
        ('Despesa', 'Despesa'),
    ]

    descricao = models.CharField(max_length=255, verbose_name="Descrição")
    categoria = models.CharField(max_length=100, verbose_name="Categoria")
    valor = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Valor")
    data = models.DateField(verbose_name="Data")
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, verbose_name="Tipo")

    def __str__(self):
        return f"{self.descricao} - {self.valor}"

    class Meta:
        verbose_name = "Transação"
        verbose_name_plural = "Transações"

class DocumentoFinanceiro(models.Model):
    arquivo = models.FileField(upload_to='documentos/', verbose_name="Arquivo")
    data_envio = models.DateTimeField(auto_now_add=True, verbose_name="Data de Envio")
    processado = models.BooleanField(default=False, verbose_name="Processado")

    def __str__(self):
        return f"Documento {self.id} - {self.data_envio}"

    class Meta:
        verbose_name = "Documento Financeiro"
        verbose_name_plural = "Documentos Financeiros"
