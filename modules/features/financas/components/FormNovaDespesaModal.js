// /modules/features/financas/components/FormNovaDespesaModal.js (SELEÇÃO DE PAGAMENTO PADRONIZADA)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

let metodoSelecionado = 'Numerário'; // Estado local para o método

export const render = () => {
    // Reseta o estado local ao renderizar
    metodoSelecionado = 'Numerário';

    return `
<div id="modal-nova-despesa-overlay" class="modal-overlay">
    <form id="form-nova-despesa" class="modal-container">
        <header class="modal-header">
            <h3 class="modal-title">Registar Nova Despesa</h3>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        <div class="modal-body">
            <div class="form-group">
                <label for="input-despesa-descricao" class="form-label">Descrição</label>
                <input type="text" id="input-despesa-descricao" required class="input-field" placeholder="Ex: Compra de gelo">
            </div>
            <div class="form-group">
                <label for="input-despesa-valor" class="form-label">Valor (Kz)</label>
                <input type="number" id="input-despesa-valor" required min="1" class="input-field" placeholder="0,00">
            </div>
           
            <div class="form-group">
                <label class="form-label">Método de Pagamento</label>
                <div id="metodo-pagamento-despesa-group" class="segmented-control-group">
                    <button type="button" class="segmented-control-button ${metodoSelecionado === 'Numerário' ? 'active' : ''}" data-metodo="Numerário">Numerário</button>
                    <button type="button" class="segmented-control-button ${metodoSelecionado === 'TPA' ? 'active' : ''}" data-metodo="TPA">TPA</button>
                </div>
            </div>
        </div>
        <footer class="modal-footer">
            <button type="submit" class="button button-error full-width">Registar Despesa</button>
        </footer>
    </form>
</div>`;
}

export const mount = (closeModal) => {
    const form = document.getElementById('form-nova-despesa');
    const metodoGroup = form.querySelector('#metodo-pagamento-despesa-group');
    form.querySelector('#input-despesa-descricao').focus();

    // Listener para os botões de método de pagamento
    metodoGroup?.addEventListener('click', e => {
        const target = e.target.closest('[data-metodo]');
        if (target) {
            metodoSelecionado = target.dataset.metodo;
            metodoGroup.querySelectorAll('.segmented-control-button').forEach(btn => btn.classList.remove('active'));
            target.classList.add('active');
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const descricao = form.querySelector('#input-despesa-descricao').value.trim();
        const valor = parseFloat(form.querySelector('#input-despesa-valor').value);
        // O método de pagamento agora vem do estado local 'metodoSelecionado'

        if (!descricao || !valor || valor <= 0) {
            return Toast.mostrarNotificacao("Preencha a descrição e um valor válido.", "erro");
        }

        const novaDespesa = {
            id: crypto.randomUUID(),
            data: new Date().toISOString(),
            descricao,
            valor,
            metodoPagamento: metodoSelecionado // Usa o valor selecionado
        };

        store.dispatch({ type: 'ADD_EXPENSE', payload: novaDespesa });
        Toast.mostrarNotificacao("Despesa registada com sucesso.");
        closeModal();
    });

    form.querySelector('.modal-close-button').addEventListener('click', closeModal);

    document.getElementById('modal-nova-despesa-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-nova-despesa-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {
    metodoSelecionado = 'Numerário'; // Reseta o estado local
};