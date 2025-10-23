// /modules/shared/components/ProductSelectionSheet.js (CORRIGIDO CRITICAMENTE: Remove morphdom da interação)
'use strict';
import { debounce } from '../lib/utils.js';
// Importa morphdom (assumindo que está disponível globalmente ou via import)
// import morphdom from 'morphdom'; // Descomente se não for global

let sheetElement = null; // Referência ao elemento overlay do sheet
let listContentElement = null; // Referência ao container da lista de produtos
let currentProducts = []; // Array de produtos {id, nome, isSelected}
let onUpdateCallback = null; // Função a ser chamada quando um item é selecionado/desselecionado
let currentTitle = 'Seleção de Produtos'; // Título atual do sheet
let isAnimating = false; // Flag para evitar re-render durante animações

// --- Renderização Interna ---

/**
 * Renderiza a lista de produtos dentro do sheet.
 * @returns {string} HTML da lista de produtos.
 */
function renderProductList() {
    if (!currentProducts || currentProducts.length === 0) {
         return `<p class="empty-list-message">Nenhum produto encontrado para ${currentTitle.replace('Selecionar ', '')}.</p>`;
    }

    return currentProducts.map(p => {
        const isSelected = p.isSelected;
        const action = isSelected ? 'remove' : 'add';

        return `
            <div class="button-list-item bottom-sheet-product-item" data-id="${p.id}" data-action="${action}">
                <span class="product-icon-placeholder"></span>
                <span class="product-name">${p.nome}</span>
                <i class="lni lni-${isSelected ? 'check' : 'plus'} button-icon" style="color: var(${isSelected ? '--feedback-success' : '--brand-primary'});"></i>
            </div>
        `;
    }).join('');
}


// --- Lógica de Interação ---

/**
 * NOVA FUNÇÃO: Atualiza APENAS a UI do item clicado diretamente no DOM.
 * @param {HTMLElement} itemElement - O elemento .bottom-sheet-product-item que foi clicado.
 * @param {boolean} isAdding - Indica se o item foi adicionado (true) ou removido (false).
 */
function updateSingleProductUI(itemElement, isAdding) {
    // Atualiza o ícone (check/plus) e sua cor
    const icon = itemElement.querySelector('i.button-icon');
    if (icon) {
        icon.className = `lni lni-${isAdding ? 'check' : 'plus'} button-icon`;
        icon.style.color = `var(${isAdding ? '--feedback-success' : '--brand-primary'})`;
    }
    // Atualiza o atributo data-action para o próximo clique
    itemElement.dataset.action = isAdding ? 'remove' : 'add';
}

/**
 * Handler para cliques DENTRO da lista de produtos no sheet (usando delegação).
 * AGORA CHAMA updateSingleProductUI em vez de renderListContent.
 * @param {Event} e - O evento de clique.
 */
function handleInteraction(e) {
    const productItem = e.target.closest('.bottom-sheet-product-item');
    if (productItem) {
        const produtoId = productItem.dataset.id;
        const isAdding = productItem.dataset.action === 'add';

        const produtoSelecionado = currentProducts.find(p => p.id === produtoId);
        if (produtoSelecionado) {
            // 1. Atualiza o estado local do sheet (isSelected)
            produtoSelecionado.isSelected = isAdding;

            // 2. *** CORREÇÃO: Atualiza APENAS a UI do item clicado ***
            updateSingleProductUI(productItem, isAdding);

            // 3. Notifica o componente pai (Step1) sobre a mudança
            if (onUpdateCallback) {
                onUpdateCallback(produtoSelecionado, isAdding);
            }
        }
        return; // Finaliza o handler
    }
}

/**
 * Renderiza/atualiza o título e a lista de produtos dentro do sheet.
 * Usa morphdom APENAS para a renderização inicial ou completa.
 * Não anexa mais listeners aqui.
 */
function renderListContent() {
    if (!sheetElement || isAnimating || !listContentElement) return;

    // Atualiza o título
    const titleElement = sheetElement.querySelector('.sheet-title');
    if (titleElement) {
         titleElement.textContent = currentTitle;
    }

    // Atualiza a lista de produtos usando morphdom (para render inicial ou reset)
    const newListHTML = renderProductList();
    if (typeof morphdom === 'function') {
        morphdom(listContentElement, `
            <div id="product-selection-sheet-content" class="modal-body sheet-content-list">
                 ${newListHTML}
            </div>
        `, { childrenOnly: true });
    } else {
        console.warn('Morphdom não encontrado, usando innerHTML para atualizar sheet.');
        listContentElement.innerHTML = newListHTML;
    }

    // Listener é anexado apenas uma vez no mount
}

// --- Funções de Ciclo de Vida (Exportadas) ---

/**
 * Cria o HTML inicial para o Bottom Sheet.
 * (Função inalterada)
 * @param {Array} initialProducts - Lista inicial de produtos ({id, nome, isSelected}).
 * @param {string} title - Título inicial do sheet.
 * @param {Function} onUpdate - Callback a ser chamado na seleção/desseleção.
 * @returns {string} O HTML do overlay do sheet.
 */
export function render(initialProducts, title, onUpdate) {
    currentProducts = initialProducts;
    onUpdateCallback = onUpdate;
    currentTitle = title;

    return `
    <div id="product-selection-sheet-overlay" class="modal-overlay bottom-sheet z-above-modal">
        <div id="product-selection-sheet-container" class="modal-container bottom-sheet-container">
            <div class="bottom-sheet-handle"></div>
            <header class="modal-header sheet-header">
                <h3 class="modal-title sheet-title">${currentTitle}</h3>
                <button id="btn-close-product-sheet" class="modal-close-button">&times;</button>
            </header>
            <div id="product-selection-sheet-content" class="modal-body sheet-content-list">
                 ${renderProductList()}
            </div>
        </div>
    </div>
    `;
}

/**
 * Monta o sheet (anexa listeners e inicia animação).
 * Anexa o listener de interação UMA VEZ aqui.
 * (Função inalterada na lógica principal)
 * @param {HTMLElement} container - O container onde o sheet foi inserido (normalmente modalsContainer).
 * @param {Function} onClose - Callback a ser chamado quando o sheet é fechado.
 */
export function mount(container, onClose) {
    sheetElement = document.getElementById('product-selection-sheet-overlay');
    if (!sheetElement) return;

    listContentElement = sheetElement.querySelector('#product-selection-sheet-content');

    requestAnimationFrame(() => {
        setTimeout(() => {
            if (sheetElement) sheetElement.classList.add('visible');
        }, 10);
    });

    sheetElement.querySelector('#btn-close-product-sheet')?.addEventListener('click', onClose);
    sheetElement.addEventListener('click', e => {
        if (e.target.id === 'product-selection-sheet-overlay') {
            onClose();
        }
    });

    // Anexa o listener de interação à lista UMA VEZ usando delegação
    listContentElement?.addEventListener('click', handleInteraction);
}

/**
 * Desmonta o sheet (inicia animação de saída e remove o elemento).
 * Remove o listener de interação aqui.
 * (Função inalterada na lógica principal)
 */
export function unmount() {
    if (sheetElement && !isAnimating) {
        isAnimating = true;
        sheetElement.classList.remove('visible');

        sheetElement.addEventListener('transitionend', () => {
            // Remove o listener de interação antes de remover o elemento
            listContentElement?.removeEventListener('click', handleInteraction);

            const closeButton = sheetElement?.querySelector('#btn-close-product-sheet');
            if(closeButton) closeButton.replaceWith(closeButton.cloneNode(true));
            sheetElement?.replaceWith(sheetElement.cloneNode(true));

            sheetElement?.remove();

            sheetElement = null;
            listContentElement = null;
            currentProducts = [];
            onUpdateCallback = null;
            isAnimating = false;
        }, { once: true });
    } else if (sheetElement && isAnimating) {
         sheetElement = null;
         listContentElement = null;
    }
}

// Estilos CSS globais (mantidos)
const styleCheck = document.getElementById('product-sheet-styles');
if (!styleCheck) {
    const style = document.createElement('style');
    style.id = 'product-sheet-styles';
    style.textContent = `
        .z-above-modal { z-index: 105; /* Garante que o sheet fique acima do modal pai (z-index 100) */ }
        .sheet-header { padding-top: var(--space-6) !important; /* Ajuste de padding para handle */ }
        .sheet-content-list { padding-top: 0 !important; max-height: 40vh; overflow-y: auto; } /* Scroll e altura máxima */
        .bottom-sheet-product-item { /* Estilo específico para itens no sheet */
            border-bottom: 1px solid var(--border-decorative);
            border-radius: 0;
            padding: var(--space-3) var(--space-4); /* Ajusta padding */
        }
        .bottom-sheet-product-item:last-child { border-bottom: none; }
        .bottom-sheet-product-item:hover { background-color: var(--bg-tertiary); }
    `;
    document.head.appendChild(style);
}


export default { render, mount, unmount }; // Exporta as funções públicas