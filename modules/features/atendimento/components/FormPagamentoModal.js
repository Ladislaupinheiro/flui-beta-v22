// /modules/features/atendimento/components/FormPagamentoModal.js (REFATORADO COM BOTTOM SHEET)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import { formatarMoeda } from '../../../shared/lib/utils.js';

export const render = (conta) => {
    const subtotal = conta.pedidos.reduce((total, p) => total + (p.preco * p.qtd), 0);
    return `
    <div id="modal-pagamento-overlay" class="modal-overlay bottom-sheet">
        <div class="modal-container bottom-sheet-container text-center">
            <header class="modal-header">
                <div>
                    <h3 class="modal-title">Finalizar Pagamento</h3>
                    <p class="modal-subtitle">Conta: ${conta.nome}</p>
                </div>
                <button type="button" class="modal-close-button">&times;</button>
            </header>
            <div class="modal-body">
                <p class="form-label">Total a Pagar</p>
                <span class="payment-total-amount">${formatarMoeda(subtotal)}</span>
                <p class="form-label font-bold">Selecione o Método de Pagamento</p>
                <div id="pagamento-metodos-container" class="payment-method-selector">
                    <button class="payment-method-button" data-metodo="Numerário">
                        <i class="lni lni-money-location"></i>
                        <span>Numerário</span>
                    </button>
                    <button class="payment-method-button" data-metodo="TPA">
                        <i class="lni lni-credit-cards"></i>
                        <span>TPA</span>
                    </button>
                </div>
            </div>
            <footer class="modal-footer">
                <button id="btn-confirmar-pagamento" disabled class="button button-primary full-width">Confirmar Pagamento</button>
            </footer>
        </div>
    </div>`;
}

export const mount = (closeModal, conta) => {
    let metodoSelecionado = '';
    const metodosContainer = document.getElementById('pagamento-metodos-container');
    const btnConfirmar = document.getElementById('btn-confirmar-pagamento');

    metodosContainer.addEventListener('click', (e) => {
        const metodoBtn = e.target.closest('.payment-method-button');
        if (!metodoBtn) return;

        metodosContainer.querySelectorAll('.payment-method-button').forEach(btn => btn.classList.remove('active'));
        metodoBtn.classList.add('active');
        
        metodoSelecionado = metodoBtn.dataset.metodo;
        btnConfirmar.disabled = false;
    });

    btnConfirmar.addEventListener('click', () => {
        if (metodoSelecionado) {
            store.dispatch({ type: 'FINALIZE_PAYMENT', payload: { contaId: conta.id, metodoPagamento: metodoSelecionado } });
            // A notificação de sucesso e o fecho da conta agora são geridos pela subscrição na ContaDetalhesView
            closeModal();
        }
    });

    document.querySelector('.modal-close-button').addEventListener('click', closeModal);
    
    document.getElementById('modal-pagamento-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-pagamento-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};