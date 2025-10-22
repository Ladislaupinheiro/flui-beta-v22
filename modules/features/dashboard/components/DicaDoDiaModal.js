// /modules/features/dashboard/components/DicaDoDiaModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

export const render = (dica) => `
<div id="modal-dica-overlay" class="modal-overlay">
    <div class="modal-container">
        <header class="modal-header">
            <div>
                <h3 class="modal-title">Dica de Gestão</h3>
                <p class="modal-subtitle category">${dica.category}</p>
            </div>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        <div class="modal-body">
            <h4 class="tip-title">${dica.title}</h4>
            <p class="modal-text">${dica.content}</p>
        </div>
        <footer class="modal-footer">
             <button class="button button-primary full-width btn-fechar-modal-footer">Entendido</button>
        </footer>
    </div>
</div>`;

export const mount = (closeModal) => {
    const overlay = document.getElementById('modal-dica-overlay');

    overlay.querySelector('.modal-close-button')?.addEventListener('click', closeModal);
    overlay.querySelector('.btn-fechar-modal-footer')?.addEventListener('click', closeModal);
    
    overlay.addEventListener('click', e => {
        if (e.target.id === 'modal-dica-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};