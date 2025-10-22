// /modules/features/financas/components/FormNovaDespesaModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = () => `
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
                <input type="number" id="input-despesa-valor" required min="1" class="input-field">
            </div>
            <div class="form-group">
                <label for="select-despesa-metodo" class="form-label">Método de Pagamento</label>
                <select id="select-despesa-metodo" class="input-field">
                    <option value="Numerário">Numerário</option>
                    <option value="TPA">TPA</option>
                </select>
            </div>
        </div>
        <footer class="modal-footer">
            <button type="submit" class="button button-error full-width">Registar Despesa</button>
        </footer>
    </form>
</div>`;

export const mount = (closeModal) => {
    const form = document.getElementById('form-nova-despesa');
    form.querySelector('#input-despesa-descricao').focus();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const descricao = form.querySelector('#input-despesa-descricao').value.trim();
        const valor = parseFloat(form.querySelector('#input-despesa-valor').value);
        const metodoPagamento = form.querySelector('#select-despesa-metodo').value;

        if (!descricao || !valor || valor <= 0) {
            return Toast.mostrarNotificacao("Preencha a descrição e um valor válido.", "erro");
        }

        const novaDespesa = {
            id: crypto.randomUUID(),
            data: new Date().toISOString(),
            descricao,
            valor,
            metodoPagamento
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

export const unmount = () => {};