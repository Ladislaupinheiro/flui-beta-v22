// /modules/features/atendimento/components/ModalSeletorQuantidade.js (REFATORADO COM BOTTOM SHEET)
'use strict';

export const render = (produtoNome, quantidadeAtual = 0) => {
    const BOTOES_QUANTIDADE = 12; // Mostra 12 botões para acesso rápido
    let buttonsHTML = '';
    for (let i = 1; i <= BOTOES_QUANTIDADE; i++) {
        const isActive = i === quantidadeAtual;
        buttonsHTML += `<button type="button" class="quantity-grid-button ${isActive ? 'active' : ''}" data-qtd="${i}">${i}</button>`;
    }

    return `
    <div id="modal-seletor-quantidade-overlay" class="modal-overlay bottom-sheet">
        <div class="modal-container bottom-sheet-container">
            <header class="modal-header">
                <div>
                    <h3 class="modal-title">Selecione a Quantidade</h3>
                    <p class="modal-subtitle">Produto: ${produtoNome}</p>
                </div>
                <button type="button" class="modal-close-button">&times;</button>
            </header>
            <div class="modal-body">
                <div id="quantity-grid" class="quantity-grid">
                    ${buttonsHTML}
                </div>
                </div>
            <footer class="modal-footer">
                <button class="button button-secondary full-width btn-cancelar-selecao">Cancelar</button>
            </footer>
        </div>
    </div>
    `;
};

export const mount = (closeModal, onConfirm) => {
    const overlay = document.getElementById('modal-seletor-quantidade-overlay');

    const handleSelection = (qtd) => {
        onConfirm(qtd);
        closeModal();
    };

    overlay.querySelector('#quantity-grid')?.addEventListener('click', e => {
        const btn = e.target.closest('.quantity-grid-button');
        if (btn) {
            handleSelection(parseInt(btn.dataset.qtd, 10));
        }
    });

    overlay.querySelector('.modal-close-button')?.addEventListener('click', closeModal);
    overlay.querySelector('.btn-cancelar-selecao')?.addEventListener('click', closeModal);
    
    overlay.addEventListener('click', e => {
        if (e.target.id === 'modal-seletor-quantidade-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};