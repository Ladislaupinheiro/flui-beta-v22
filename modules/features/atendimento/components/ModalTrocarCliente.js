// /modules/features/atendimento/components/ModalTrocarCliente.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

import store from '../../../shared/services/Store.js';
import { debounce } from '../../../shared/lib/utils.js';

function renderizarResultadosBusca(termo, contaId) {
    const resultadosContainer = document.getElementById('trocar-cliente-resultados');
    if (!resultadosContainer) return;

    if (!termo || termo.length < 1) {
        resultadosContainer.innerHTML = '<p class="empty-list-message">Comece a digitar para encontrar um cliente.</p>';
        return;
    }

    const { clientes, contasAtivas } = store.getState();
    const contaAtual = contasAtivas.find(c => c.id === contaId);
    const clienteAtualId = contaAtual ? contaAtual.clienteId : null;

    const resultados = clientes.filter(c => 
        c.id !== clienteAtualId && c.nome.toLowerCase().includes(termo.toLowerCase())
    );

    if (resultados.length > 0) {
        resultadosContainer.innerHTML = resultados.map(cliente => `
            <div class="search-result-item interactive" data-cliente-id="${cliente.id}" data-cliente-nome="${cliente.nome}">
                <img src="${cliente.fotoDataUrl || './icons/logo-small-192.png'}" alt="Foto de ${cliente.nome}" class="avatar">
                <span class="search-result-name">${cliente.nome}</span>
            </div>
        `).join('');
    } else {
        resultadosContainer.innerHTML = '<p class="empty-list-message">Nenhum outro cliente encontrado com esse nome.</p>';
    }
}

export const render = (conta) => {
    const cliente = store.getState().clientes.find(c => c.id === conta.clienteId);
    return `
<div id="modal-trocar-cliente-overlay" class="modal-overlay">
    <div class="modal-container">
        <header class="modal-header">
            <div>
                <h3 class="modal-title">Trocar Titular da Conta</h3>
                <p class="modal-subtitle">Titular atual: ${cliente ? cliente.nome : 'N/A'}</p>
            </div>
        </header>
        <div class="modal-body with-search">
            <div class="form-group">
                <input type="search" id="input-busca-trocar-cliente" class="input-field" placeholder="Encontrar novo titular...">
            </div>
            <div id="trocar-cliente-resultados" class="search-results-list">
                 <p class="empty-list-message">Comece a digitar para encontrar um cliente.</p>
            </div>
        </div>
        <footer class="modal-footer">
            <button id="btn-cancelar-troca" class="button button-secondary full-width">Cancelar</button>
        </footer>
    </div>
</div>`;
};

export const mount = (closeModal, conta, onConfirm) => {
    const inputBusca = document.getElementById('input-busca-trocar-cliente');
    const resultadosContainer = document.getElementById('trocar-cliente-resultados');
    inputBusca.focus();

    inputBusca.addEventListener('input', debounce(e => renderizarResultadosBusca(e.target.value, conta.id), 250));
    
    resultadosContainer.addEventListener('click', e => {
        const target = e.target.closest('[data-cliente-id]');
        if(target) {
            const { clienteId, clienteNome } = target.dataset;
            if (typeof onConfirm === 'function') {
                onConfirm({ clienteId, clienteNome });
            }
            closeModal();
        }
    });

    document.getElementById('btn-cancelar-troca')?.addEventListener('click', closeModal);
    document.getElementById('modal-trocar-cliente-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'modal-trocar-cliente-overlay') closeModal();
    });
};

export const unmount = () => {};