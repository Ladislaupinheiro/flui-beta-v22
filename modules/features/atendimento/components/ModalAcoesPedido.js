// /modules/features/atendimento/components/ModalAcoesPedido.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

export const render = (pedido) => `
<div id="modal-acoes-pedido-overlay" class="modal-overlay bottom-sheet">
    <div class="modal-container bottom-sheet-container">
        <header class="modal-header">
            <h3 class="modal-title">${pedido.qtd}x ${pedido.nome}</h3>
        </header>
        <div class="modal-body">
            <button id="btn-editar-quantidade" class="button-list-item">
                <i class="lni lni-pencil"></i>
                <span>Editar Quantidade</span>
            </button>
            <button id="btn-remover-pedido" class="button-list-item text-error">
                <i class="lni lni-trash-can"></i>
                <span>Remover da Conta</span>
            </button>
        </div>
        <footer class="modal-footer">
             <button id="btn-cancelar-acoes" class="button button-secondary full-width">Cancelar</button>
        </footer>
    </div>
</div>`;

export const mount = (closeModal, onEdit, onRemove) => {
    const overlay = document.getElementById('modal-acoes-pedido-overlay');

    overlay.querySelector('#btn-editar-quantidade')?.addEventListener('click', () => {
        onEdit();
        closeModal();
    });
    overlay.querySelector('#btn-remover-pedido')?.addEventListener('click', () => {
        onRemove();
        closeModal();
    });
    overlay.querySelector('#btn-cancelar-acoes')?.addEventListener('click', closeModal);
    
    overlay.addEventListener('click', e => {
        if (e.target.id === 'modal-acoes-pedido-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};