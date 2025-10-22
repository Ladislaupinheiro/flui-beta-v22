// /modules/features/clientes/components/FormLiquidarDividaModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

export const render = (cliente) => {
    const dividaTotal = cliente.dividas.reduce((total, divida) => {
        if (divida.tipo === 'debito') return total + divida.valor;
        if (divida.tipo === 'credito') return total - Math.abs(divida.valor);
        return total;
    }, 0);

    return `
    <div id="modal-liquidar-divida-overlay" class="modal-overlay">
        <form id="form-liquidar-divida" class="modal-container">
            <header class="modal-header">
                <div>
                    <h3 class="modal-title">Liquidar Dívida</h3>
                    <p class="modal-subtitle">Cliente: ${cliente.nome}</p>
                </div>
                <button type="button" class="modal-close-button">&times;</button>
            </header>
            <div class="modal-body">
                <div class="debt-summary">
                    <span class="debt-label">Dívida Atual:</span>
                    <strong class="debt-amount">${dividaTotal.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</strong>
                </div>
                <div class="form-group">
                    <label for="input-liquidar-valor" class="form-label">Valor a Pagar (Kz)</label>
                    <input type="number" id="input-liquidar-valor" required min="1" max="${dividaTotal}" class="input-field">
                </div>
                
                <div class="form-group">
                    <label for="select-liquidar-metodo" class="form-label">Método de Pagamento</label>
                    <select id="select-liquidar-metodo" class="input-field">
                        <option value="Numerário">Numerário</option>
                        <option value="TPA">TPA</option>
                    </select>
                </div>

            </div>
            <footer class="modal-footer">
                <button type="submit" class="button button-success full-width">Registar Pagamento</button>
            </footer>
        </form>
    </div>`;
};

export const mount = (closeModal, cliente) => {
    const form = document.getElementById('form-liquidar-divida');
    const inputValor = form.querySelector('#input-liquidar-valor');
    inputValor.focus();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const valor = parseFloat(inputValor.value);
        const metodoPagamento = form.querySelector('#select-liquidar-metodo').value;

        if (!valor || valor <= 0) {
            return Toast.mostrarNotificacao("Insira um valor de pagamento válido.", "erro");
        }
        
        const dividaTotal = cliente.dividas.reduce((total, divida) => {
            if (divida.tipo === 'debito') return total + divida.valor;
            if (divida.tipo === 'credito') return total - Math.abs(divida.valor);
            return total;
        }, 0);

        if (valor > dividaTotal) {
            return Toast.mostrarNotificacao("O valor a pagar não pode ser maior que a dívida atual.", "erro");
        }
        
        store.dispatch({ 
            type: 'SETTLE_DEBT', 
            payload: { clienteId: cliente.id, valor, metodoPagamento } 
        });

        Toast.mostrarNotificacao("Pagamento de dívida registado.");
        closeModal();
    });
    
    form.querySelector('.modal-close-button').addEventListener('click', closeModal);
    
    document.getElementById('modal-liquidar-divida-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-liquidar-divida-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};