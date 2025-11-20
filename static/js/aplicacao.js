// === ELEMENTOS DO DOM ===
const modalUpload = document.getElementById('modal-upload');
const btnAbrirModalUpload = document.getElementById('btn-abrir-modal-upload');
const btnFecharModalUpload = document.querySelector('.fechar-modal-upload');
const formularioUpload = document.getElementById('formulario-upload');
const statusUpload = document.getElementById('status-upload');

const modalTransacao = document.getElementById('modal-transacao');
const btnAbrirModalTransacao = document.getElementById('btn-adicionar-transacao');
const btnFecharModalTransacao = document.querySelector('.fechar-modal-transacao');
const formularioTransacao = document.getElementById('formulario-transacao');
const statusTransacao = document.getElementById('status-transacao');

const campoChat = document.getElementById('campo-chat');
const btnEnviarChat = document.getElementById('btn-enviar-chat');
const mensagensChat = document.getElementById('mensagens-chat');

// === INICIALIZAÇÃO (DOM READY) ===
document.addEventListener('DOMContentLoaded', function () {
    // Seletor de Data (Flatpickr)
    flatpickr("#campo-data", {
        dateFormat: "d/m/Y",
        locale: "pt",
        theme: "dark",
        allowInput: true
    });

    // Máscara de Dinheiro (jQuery Mask)
    $('#campo-valor').mask('R$ 000.000.000,00', { reverse: true });

    // Carregar dados iniciais
    atualizarTabela();
});

// === CONTROLE DE MODAIS ===

// Modal de Upload
if (btnAbrirModalUpload) {
    btnAbrirModalUpload.addEventListener('click', () => modalUpload.classList.remove('oculto'));
}

if (btnFecharModalUpload) {
    btnFecharModalUpload.addEventListener('click', () => modalUpload.classList.add('oculto'));
}

// Modal de Transação
if (btnAbrirModalTransacao) {
    btnAbrirModalTransacao.addEventListener('click', (e) => {
        e.preventDefault();
        if (modalTransacao) modalTransacao.classList.remove('oculto');
    });
}

if (btnFecharModalTransacao) {
    btnFecharModalTransacao.addEventListener('click', () => modalTransacao.classList.add('oculto'));
}

// Fechar ao clicar fora
window.addEventListener('click', (e) => {
    if (e.target === modalUpload) modalUpload.classList.add('oculto');
    if (e.target === modalTransacao) modalTransacao.classList.add('oculto');
});

// === UPLOAD DE ARQUIVO ===
if (formularioUpload) {
    formularioUpload.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dadosFormulario = new FormData(formularioUpload);
        const botaoEnviar = formularioUpload.querySelector('button[type="submit"]');

        botaoEnviar.disabled = true;
        botaoEnviar.textContent = 'Processando...';
        statusUpload.innerHTML = '<p style="color: var(--text-secondary)">Enviando arquivo...</p>';

        try {
            const resposta = await fetch('/api/enviar-arquivo/', {
                method: 'POST',
                body: dadosFormulario
            });

            const dados = await resposta.json();

            if (dados.sucesso) {
                statusUpload.innerHTML = `<p style="color: var(--success-color)"><i class="fa-solid fa-check"></i> ${dados.mensagem}</p>`;
                setTimeout(() => {
                    modalUpload.classList.add('oculto');
                    statusUpload.innerHTML = '';
                    formularioUpload.reset();
                }, 2000);
            } else {
                statusUpload.innerHTML = `<p style="color: var(--danger-color)"><i class="fa-solid fa-circle-exclamation"></i> ${dados.mensagem}</p>`;
            }
        } catch (erro) {
            console.error('Erro no upload:', erro);
            statusUpload.innerHTML = '<p style="color: var(--danger-color)">Erro ao enviar arquivo.</p>';
        } finally {
            botaoEnviar.disabled = false;
            botaoEnviar.textContent = 'Processar';
        }
    });
}

// === NOVA TRANSAÇÃO ===
if (formularioTransacao) {
    formularioTransacao.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dadosFormulario = new FormData(formularioTransacao);
        const dadosObjeto = Object.fromEntries(dadosFormulario.entries());
        const botaoSalvar = formularioTransacao.querySelector('button[type="submit"]');

        botaoSalvar.disabled = true;
        botaoSalvar.textContent = 'Salvando...';
        statusTransacao.innerHTML = '<p style="color: var(--text-secondary)">Salvando transação...</p>';

        try {
            const resposta = await fetch('/api/nova-transacao/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosObjeto)
            });

            const dados = await resposta.json();

            if (dados.sucesso) {
                // Atualizar localStorage para exibição
                const transacoesLocais = JSON.parse(localStorage.getItem('transacoes_financeiras')) || [];
                transacoesLocais.push({
                    nome_descricao: dadosObjeto.nome_descricao,
                    categoria: dadosObjeto.categoria,
                    data: dadosObjeto.data,
                    valor: dadosObjeto.valor,
                    tipo: dadosObjeto.tipo
                });
                localStorage.setItem('transacoes_financeiras', JSON.stringify(transacoesLocais));
                atualizarTabela();

                statusTransacao.innerHTML = `<p style="color: var(--success-color)"><i class="fa-solid fa-check"></i> ${dados.mensagem}</p>`;
                setTimeout(() => {
                    modalTransacao.classList.add('oculto');
                    statusTransacao.innerHTML = '';
                    formularioTransacao.reset();
                }, 1500);
            } else {
                statusTransacao.innerHTML = `<p style="color: var(--danger-color)"><i class="fa-solid fa-circle-exclamation"></i> ${dados.mensagem}</p>`;
            }
        } catch (erro) {
            console.error('Erro ao salvar:', erro);
            statusTransacao.innerHTML = '<p style="color: var(--danger-color)">Erro ao salvar transação.</p>';
        } finally {
            botaoSalvar.disabled = false;
            botaoSalvar.textContent = 'Salvar Transação';
        }
    });
}

// === CHATBOT ===
async function enviarMensagemChat() {
    const textoMensagem = campoChat.value.trim();
    if (!textoMensagem) return;

    adicionarMensagem(textoMensagem, 'usuario');
    campoChat.value = '';

    const idCarregamento = adicionarMensagem('Pensando...', 'bot', true);

    try {
        const resposta = await fetch('/api/chat/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pergunta: textoMensagem })
        });

        const dados = await resposta.json();
        removerMensagem(idCarregamento);

        if (dados.resposta) {
            adicionarMensagem(dados.resposta, 'bot');
        } else if (dados.erro) {
            adicionarMensagem(`Erro: ${dados.erro}`, 'bot');
        }
    } catch (erro) {
        removerMensagem(idCarregamento);
        adicionarMensagem('Desculpe, ocorreu um erro. Tente novamente.', 'bot');
        console.error('Erro no chat:', erro);
    }
}

if (btnEnviarChat) {
    btnEnviarChat.addEventListener('click', enviarMensagemChat);
}

if (campoChat) {
    campoChat.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensagemChat();
    });
}

function adicionarMensagem(texto, remetente, carregando = false) {
    const divMensagem = document.createElement('div');
    divMensagem.classList.add('mensagem', remetente);
    if (carregando) divMensagem.id = `msg-${Date.now()}`;

    // Suporte básico a markdown (negrito)
    const textoFormatado = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    divMensagem.innerHTML = textoFormatado;

    mensagensChat.appendChild(divMensagem);
    mensagensChat.scrollTop = mensagensChat.scrollHeight;
    return divMensagem.id;
}

function removerMensagem(id) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.remove();
}

// === INTERFACE DE TRANSAÇÕES ===
function atualizarTabela() {
    const corpoTabela = document.getElementById('corpo-tabela-transacoes');
    const transacoes = JSON.parse(localStorage.getItem('transacoes_financeiras')) || [];

    if (!corpoTabela) return;

    corpoTabela.innerHTML = '';

    transacoes.forEach((transacao, indice) => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${transacao.nome_descricao}</td>
            <td><span class="badge">${transacao.categoria}</span></td>
            <td>${transacao.data}</td>
            <td class="${transacao.tipo === 'Receita' ? 'texto-sucesso' : 'texto-erro'}">${transacao.valor}</td>
            <td>${transacao.tipo}</td>
            <td>
                <button onclick="excluirTransacao(${indice})" class="btn-icone deletar">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>`;
        corpoTabela.appendChild(linha);
    });

    atualizarResumo();
}

function atualizarResumo() {
    const transacoes = JSON.parse(localStorage.getItem('transacoes_financeiras')) || [];
    let totalReceitas = 0;
    let totalDespesas = 0;

    transacoes.forEach(transacao => {
        let valorLimpo = transacao.valor.toString().replace('R$', '').trim();

        // Normalizar formato de moeda
        if (valorLimpo.includes(',') && !valorLimpo.includes('.')) {
            valorLimpo = valorLimpo.replace(',', '.');
        } else if (valorLimpo.includes('.') && valorLimpo.includes(',')) {
            valorLimpo = valorLimpo.replace('.', '').replace(',', '.');
        }

        const valorNumerico = parseFloat(valorLimpo) || 0;

        if (transacao.tipo === 'Receita') {
            totalReceitas += valorNumerico;
        } else if (transacao.tipo === 'Despesa') {
            totalDespesas += valorNumerico;
        }
    });

    const saldoFinal = totalReceitas - totalDespesas;

    document.getElementById('total-receitas').textContent = totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-despesas').textContent = totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('saldo-final').textContent = saldoFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função global para exclusão (chamada via onclick do HTML)
window.excluirTransacao = function (indice) {
    const transacoes = JSON.parse(localStorage.getItem('transacoes_financeiras')) || [];
    transacoes.splice(indice, 1);
    localStorage.setItem('transacoes_financeiras', JSON.stringify(transacoes));
    atualizarTabela();
}