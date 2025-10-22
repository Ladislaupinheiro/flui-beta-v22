// /modules/shared/ui/ConfirmacaoModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

export const render = (titulo, mensagem) => `
<div id="modal-confirmacao-overlay" class="modal-overlay">
    <div class="modal-container text-center">
        <div class="modal-body">
            <h3 class="modal-title">${titulo}</h3>
            <p class="modal-text">${mensagem}</p>
        </div>
        <div class="modal-footer footer-grid-2-col">
            <button id="btn-cancelar-confirmacao" class="button button-secondary full-width">Cancelar</button>
            <button id="btn-confirmar-acao" class="button button-error full-width">Confirmar</button>
        </div>
    </div>
</div>`;

export const mount = (closeModal, titulo, mensagem, onConfirmCallback) => {
    const overlay = document.getElementById('modal-confirmacao-overlay');

    overlay.querySelector('#btn-confirmar-acao')?.addEventListener('click', () => {
        if (typeof onConfirmCallback === 'function') onConfirmCallback();
        closeModal();
    });
    
    overlay.querySelector('#btn-cancelar-confirmacao')?.addEventListener('click', closeModal);

    overlay.addEventListener('click', (e) => {
        if (e.target.id === 'modal-confirmacao-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};