// /modules/shared/ui/PackagingSlider.js (NOVO UTILITÁRIO)
'use strict';

/**
 * Renderiza um seletor de embalagem com 3 opções fixas (6, 12, 24).
 * @param {string} produtoId - ID do produto (para data-attribute).
 * @param {number} currentValue - Valor atualmente selecionado.
 * @returns {string} HTML dos botões segmentados.
 */
export function render(produtoId, currentValue) {
    const options = [6, 12, 24];
    return `
        <div class="segmented-control-group packaging-slider" data-product-id="${produtoId}">
            ${options.map(value => `
                <button type="button" class="segmented-control-button" 
                        data-value="${value}"
                        ${currentValue === value ? 'active' : ''}>
                    ${value}
                </button>
            `).join('')}
        </div>
    `;
}

export function attachListener(container, onSelect) {
    const sliderGroup = container.querySelector('.packaging-slider');
    sliderGroup?.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (button) {
            const value = parseInt(button.dataset.value, 10);
            sliderGroup.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            onSelect(value);
        }
    });
}

export default { render, attachListener };