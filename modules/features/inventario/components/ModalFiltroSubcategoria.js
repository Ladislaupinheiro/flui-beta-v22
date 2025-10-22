// /modules/features/inventario/components/ModalFiltroSubcategoria.js
'use strict';

export const render = (subcategorias = [], categoriaPaiNome = '') => {
    const itemsHTML = [...subcategorias]
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map(cat => `
            <button class="button-list-item" data-subcategoria-nome="${cat.nome.toLowerCase()}">
                ${cat.cor ? `<div class="color-swatch-small" style="background-color: ${cat.cor};"></div>` : '<div class="color-swatch-small transparent"></div>'}
                <span>${cat.nome}</span>
            </button>
        `).join('');

    return `
<div id="modal-filtro-subcategoria-overlay" class="modal-overlay bottom-sheet">
    <div class="modal-container bottom-sheet-container">
        <div class="bottom-sheet-handle"></div>
        <header class="modal-header" style="padding-bottom: 8px;">
            <h3 class="modal-title">Filtrar ${categoriaPaiNome} por:</h3>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        <div class="modal-body" style="padding-top: 0;">
            ${itemsHTML}
        </div>
    </div>
</div>`;
};

export const mount = (closeModal, subcategorias = [], onSelectCallback) => {
    const overlay = document.getElementById('modal-filtro-subcategoria-overlay');
    const container = overlay?.querySelector('.modal-container');

    if (!overlay || !container) {
        return;
    }

    const handleSelection = (e) => {
        const targetButton = e.target.closest('button[data-subcategoria-nome]');
        if (targetButton) {
            const nomeSubcategoria = targetButton.dataset.subcategoriaNome;
            const subcategoriaSelecionada = subcategorias.find(
                cat => cat.nome.toLowerCase() === nomeSubcategoria
            );
            if (subcategoriaSelecionada && typeof onSelectCallback === 'function') {
                onSelectCallback(subcategoriaSelecionada);
            }
            closeModal();
        }

        if (e.target.closest('.modal-close-button')) {
            closeModal();
        }
    };

    container.addEventListener('click', handleSelection);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });

    overlay._handleSelection = handleSelection;
};

export const unmount = () => {
    const overlay = document.getElementById('modal-filtro-subcategoria-overlay');
    const container = overlay?.querySelector('.modal-container');

    if (overlay && overlay._handleSelection) {
        container?.removeEventListener('click', overlay._handleSelection);
        delete overlay._handleSelection;
    }
};