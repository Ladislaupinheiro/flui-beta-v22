// /modules/features/atendimento/components/FormNovaContaModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import { debounce } from '../../../shared/lib/utils.js';
import { abrirModalAddCliente } from '../../../shared/components/Modals.js';

let clienteSelecionado = null;

function renderizarResultadosBusca(termo) {
    const resultadosContainer = document.getElementById('busca-cliente-resultados');
    const inputBusca = document.getElementById('input-busca-cliente-conta');
    if (!resultadosContainer || !inputBusca) return;

    if (!termo || termo.length < 2) {
        resultadosContainer.innerHTML = '';
        resultadosContainer.classList.add('hidden');
        return;
    }

    const clientes = store.getState().clientes;
    const resultados = clientes.filter(c => c.nome.toLowerCase().includes(termo.toLowerCase()));

    if (resultados.length > 0) {
        resultadosContainer.innerHTML = resultados.map(cliente => `
            <div class="search-result-item" data-cliente-id="${cliente.id}" data-cliente-nome="${cliente.nome}">
                ${cliente.nome}
            </div>
        `).join('');
        resultadosContainer.classList.remove('hidden');
    } else {
        resultadosContainer.innerHTML = '<p class="empty-list-message">Nenhum cliente encontrado.</p>';
        resultadosContainer.classList.remove('hidden');
    }
}

export const render = () => `
<div id="modal-nova-conta-overlay" class="modal-overlay">
    <form id="form-nova-conta" class="modal-container">
        <header class="modal-header">
            <h3 class="modal-title">Criar Nova Conta</h3>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        
        <nav id="tabs-conta-tipo" class="tab-nav modal-tabs">
            <button type="button" class="tab-button active" data-modo="registado">Cliente Registado</button>
            <button type="button" class="tab-button" data-modo="avulsa">Conta Avulsa</button>
        </nav>

        <div class="modal-body">
            <div id="modo-registado">
                <div class="form-group with-autocomplete">
                    <label for="input-busca-cliente-conta" class="form-label">Buscar Cliente</label>
                    <input type="search" id="input-busca-cliente-conta" class="input-field" placeholder="Digite o nome do cliente...">
                    <div id="busca-cliente-resultados" class="autocomplete-results hidden"></div>
                </div>
                <div class="form-divider">ou</div>
                <button type="button" id="btn-registar-novo-cliente-inline" class="button button-secondary full-width dashed">
                    + Registar Novo Cliente
                </button>
            </div>

            <div id="modo-avulsa" class="hidden">
                <div class="form-group">
                    <label for="input-nome-conta-avulsa" class="form-label">Nome da Conta / Mesa</label>
                    <input type="text" id="input-nome-conta-avulsa" class="input-field" placeholder="Ex: Mesa 5, Balcão">
                </div>
            </div>
        </div>

        <footer class="modal-footer">
            <button type="submit" id="btn-submit-nova-conta" class="button button-primary full-width">Iniciar Atendimento</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal) => {
    clienteSelecionado = null;
    let modoAtual = 'registado';

    const form = document.getElementById('form-nova-conta');
    const tabsContainer = document.getElementById('tabs-conta-tipo');
    const modoRegistadoDiv = document.getElementById('modo-registado');
    const modoAvulsaDiv = document.getElementById('modo-avulsa');
    const inputBusca = document.getElementById('input-busca-cliente-conta');
    const inputAvulsa = document.getElementById('input-nome-conta-avulsa');
    const resultadosContainer = document.getElementById('busca-cliente-resultados');
    
    tabsContainer.addEventListener('click', e => {
        const target = e.target.closest('.tab-button');
        if (!target) return;

        tabsContainer.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');
        
        modoAtual = target.dataset.modo;

        modoRegistadoDiv.classList.toggle('hidden', modoAtual !== 'registado');
        modoAvulsaDiv.classList.toggle('hidden', modoAtual !== 'avulsa');
        
        clienteSelecionado = null;
        if(inputBusca) inputBusca.value = '';
        if(inputAvulsa) inputAvulsa.value = '';
        if(resultadosContainer) resultadosContainer.classList.add('hidden');
    });

    inputBusca.addEventListener('input', debounce(e => renderizarResultadosBusca(e.target.value), 300));
    
    resultadosContainer.addEventListener('click', e => {
        const target = e.target.closest('[data-cliente-id]');
        if(target) {
            clienteSelecionado = { id: target.dataset.clienteId, nome: target.dataset.clienteNome };
            inputBusca.value = clienteSelecionado.nome;
            resultadosContainer.classList.add('hidden');
        }
    });

    document.getElementById('btn-registar-novo-cliente-inline').addEventListener('click', () => {
        abrirModalAddCliente();
    });

    form.addEventListener('submit', e => {
        e.preventDefault();

        let nomeConta, clienteId;
        
        if (modoAtual === 'registado') {
            if (!clienteSelecionado) {
                return Toast.mostrarNotificacao("Por favor, selecione um cliente da lista ou crie um novo.", "erro");
            }
            nomeConta = clienteSelecionado.nome;
            clienteId = clienteSelecionado.id;
        } else { 
            nomeConta = inputAvulsa.value.trim();
            if (!nomeConta) {
                return Toast.mostrarNotificacao("O nome da conta não pode estar vazio.", "erro");
            }
        }
        
        if (store.getState().contasAtivas.some(c => c.status === 'ativa' && c.nome.toLowerCase() === nomeConta.toLowerCase())) {
            return Toast.mostrarNotificacao(`Já existe uma conta ativa com o nome "${nomeConta}".`, "erro");
        }

        store.dispatch({ type: 'ADD_ACCOUNT', payload: { nome: nomeConta, clienteId: clienteId || null } });
        Toast.mostrarNotificacao(`Conta "${nomeConta}" criada com sucesso!`);
        closeModal();
    });

    form.querySelector('.modal-close-button').addEventListener('click', closeModal);
    document.getElementById('modal-nova-conta-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-nova-conta-overlay') closeModal();
    });
};

export const unmount = () => {
    clienteSelecionado = null;
};