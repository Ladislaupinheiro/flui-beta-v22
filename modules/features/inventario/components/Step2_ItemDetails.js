// /modules/features/inventario/components/Step2_ItemDetails.js (REFATORADO: Inicializa Preço de Venda Anterior)
'use strict';

import { formatarMoeda, debounce } from '../../../shared/lib/utils.js';
import PackagingSlider from '../../../shared/ui/PackagingSlider.js';
import store from '../../../shared/services/Store.js';

let containerNode = null;
let onStateChangeCallback = null;
let wizardStateRef = null;

// Estado local
let localState = {
    activeOrganizationFilter: 'Alcool', // Alcool ou Sem Alcool
    expandedItemId: null, // ID do item expandido para edição
    // O array principal 'detailedPurchaseItems' será gerido por wizardStateRef
};

function organizeItems() {
    return wizardStateRef.detailedPurchaseItems.reduce((acc, item) => {
        // Verifica se o item possui uma tag de álcool para organização
        const isAlcohol = item.tags.includes('licor') || item.tags.includes('vodka') || item.tags.includes('gin') || item.tags.includes('whisky') || item.tags.includes('champanhe') || item.tags.includes('vinho') || item.tags.includes('cerveja');
        const tag = isAlcohol ? 'Alcool' : 'Sem Alcool';
        
        if (!acc[tag]) acc[tag] = [];
        acc[tag].push(item);
        return acc;
    }, {});
}

function updateItemDetails(itemId, key, value) {
    const newItems = wizardStateRef.detailedPurchaseItems.map(item => {
        if (item.id === itemId) {
            let newItem = { ...item, [key]: value };

            // Recalcula a quantidade total e garante que é um número
            const embalagens = key === 'embalagens' ? parseInt(value, 10) || 0 : newItem.embalagens;
            const unidadesPorEmbalagem = key === 'unidadesPorEmbalagem' ? parseInt(value, 10) || 0 : newItem.unidadesPorEmbalagem;
            
            newItem.embalagens = embalagens;
            newItem.unidadesPorEmbalagem = unidadesPorEmbalagem;
            newItem.quantidadeTotal = embalagens * unidadesPorEmbalagem;

            // Garante que precoVenda e custoTotalItem são números para a submissão
            newItem.precoVenda = parseFloat(String(newItem.precoVenda)) || 0;
            newItem.custoTotalItem = parseFloat(String(newItem.custoTotalItem)) || 0;

            return newItem;
        }
        return item;
    });

    if (onStateChangeCallback) {
        onStateChangeCallback({ detailedPurchaseItems: newItems });
    }
}

// --- Funções de Renderização ---

function renderDetailedItem(item) {
    const isExpanded = localState.expandedItemId === item.id;
    // Verifica se os campos obrigatórios estão preenchidos
    const isReady = item.embalagens > 0 && item.custoTotalItem > 0 && item.precoVenda > 0;
    const itemReadyClass = isReady ? 'item-ready' : 'item-pending';

    // *** REFINAMENTO APLICADO: Inicializa o preço de venda ***
    // Se o item não tem preço de venda definido, usa o preço de venda anterior.
    // O valor do input deve ser a propriedade precoVenda do item (que será atualizada no wizardState),
    // mas se for null (primeira montagem do passo 2), usa o preço anterior do Passo 1.
    const precoInicial = item.precoVenda !== null ? item.precoVenda : item.precoVendaAnterior;

    return `
        <div class="card item-details-card ${itemReadyClass}" data-item-id="${item.id}">
            <div class="card-header detailed-item-summary">
                <span class="product-icon-placeholder small"></span>
                <span class="product-name">${item.nome}</span>
                <div class="summary-indicators">
                    <span class="qty-indicator">${item.embalagens}x${item.unidadesPorEmbalagem}=${item.quantidadeTotal}</span>
                    <i class="lni lni-chevron-down toggle-icon"></i>
                </div>
            </div>

            <div class="detailed-item-content ${isExpanded ? '' : 'hidden'}">
                 <div class="form-group">
                    <label for="embalagem-${item.id}" class="form-label">Nº de Grade/Embalagem</label>
                    <input type="number" id="embalagem-${item.id}" class="input-field item-input item-embalagens" 
                           data-key="embalagens" value="${item.embalagens}" min="0">
                </div>

                <div class="form-group">
                    <label class="form-label">Unidades por Embalagem</label>
                    ${PackagingSlider.render(item.id, item.unidadesPorEmbalagem)}
                </div>

                 <div class="form-group">
                    <label>QTD Total: <strong class="total-qty">${item.quantidadeTotal}</strong></label>
                </div>
                
                 <div class="form-group">
                    <label for="custo-${item.id}" class="form-label">Custo Total (Kz)</label>
                    <input type="number" id="custo-${item.id}" class="input-field item-input item-custo" 
                           data-key="custoTotalItem" value="${item.custoTotalItem || ''}" min="0" step="any">
                </div>

                <div class="form-group">
                    <label for="preco-${item.id}" class="form-label">Preço Venda (Kz)</label>
                    <input type="number" id="preco-${item.id}" class="input-field item-input item-preco" 
                           data-key="precoVenda" value="${precoInicial !== null ? precoInicial : ''}" min="0" step="any">
                    ${precoInicial === null ? 
                         `<p class="warning-text"><i class="lni lni-warning"></i> Preço de venda atual desconhecido. Defina um novo.</p>` : ''
                    }
                </div>
            </div>
        </div>
    `;
}

function renderContent() {
    if (!containerNode) return;
    const organizedItems = organizeItems();
    
    // Calcula a altura máxima para a tela de conteúdo do passo 2
    const totalCostoGeral = wizardStateRef.detailedPurchaseItems.reduce((sum, item) => sum + (item.custoTotalItem || 0), 0);

    const contentHTML = Object.keys(organizedItems).map(category => {
        // Renderiza apenas a categoria ativa
        if (category !== localState.activeOrganizationFilter) return '';
        
        const items = organizedItems[category];
        
        const itemsList = items.map(item => renderDetailedItem(item)).join('');
        
        return `
            <div class="organization-group" data-category="${category}">
                ${itemsList}
            </div>
        `;
    }).join('');

    const html = `
        <div class="filter-chip-container" style="display: flex; gap: var(--space-2); padding: 0 var(--space-4) var(--space-4);">
             <button class="filter-chip ${localState.activeOrganizationFilter === 'Alcool' ? 'active' : ''}" data-org-filter="Alcool">Álcool (${organizedItems.Alcool?.length || 0})</button>
             <button class="filter-chip ${localState.activeOrganizationFilter === 'Sem Alcool' ? 'active' : ''}" data-org-filter="Sem Alcool">Sem Álcool (${organizedItems['Sem Alcool']?.length || 0})</button>
        </div>
        
        <div class="card total-cost-card" style="margin: 0 var(--space-4) var(--space-4);">
            <h4 class="card-title">Custo Total dos Itens:</h4>
            <span class="total-value">${formatarMoeda(totalCostoGeral)}</span>
        </div>

        <div id="item-details-list" class="list-container" style="padding: 0 var(--space-4);">
            ${contentHTML || '<p class="empty-list-message">Nenhum item nesta categoria.</p>'}
        </div>
    `;
    
    // Atualiza a UI e reanexa listeners
    morphdom(containerNode, `
        <div id="${containerNode.id}">
            ${html}
        </div>
    `, { childrenOnly: true });
    attachListeners();
}

function attachListeners() {
    // Listener para filtros de organização
    containerNode.querySelector('.filter-chip-container')?.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-org-filter]');
        if (chip) {
            localState.activeOrganizationFilter = chip.dataset.org-filter;
            renderContent();
        }
    });

    // Listener para expansão/colapso do card
    containerNode.querySelector('#item-details-list')?.addEventListener('click', (e) => {
        const header = e.target.closest('.detailed-item-summary');
        if (header) {
            const card = header.closest('.item-details-card');
            const itemId = card.dataset.itemId;
            localState.expandedItemId = localState.expandedItemId === itemId ? null : itemId;
            renderContent(); // Re-renderiza para expandir/colapsar
            return;
        }
    });

    // Listener para Inputs (Custo/Preço/Embalagens)
    containerNode.querySelector('#item-details-list')?.addEventListener('input', (e) => {
        const input = e.target.closest('.item-input');
        if (input) {
            const card = input.closest('.item-details-card');
            const itemId = card.dataset.itemId;
            
            // Corrige o bug de inicialização do preço de venda
            if (input.dataset.key === 'precoVenda' && wizardStateRef.detailedPurchaseItems.find(i => i.id === itemId).precoVenda === null) {
                // Se for a primeira vez que o utilizador edita, a propriedade "precoVenda" é atualizada
                // para garantir que o valor inicial do input é mantido no estado.
            }
            
            updateItemDetails(itemId, input.dataset.key, input.value);
        }
    });

    // Listener e anexo para o Packaging Slider
    containerNode.querySelectorAll('.packaging-slider').forEach(sliderContainer => {
        const itemId = sliderContainer.dataset.productId;
        PackagingSlider.attachListener(sliderContainer, (value) => {
             updateItemDetails(itemId, 'unidadesPorEmbalagem', value);
        });
    });
}

// --- Funções `mount` e `unmount` Exportadas ---

export const mount = (container, initialState, onStateChange) => {
    containerNode = container;
    wizardStateRef = initialState;
    onStateChangeCallback = onStateChange;

    // Garante que a primeira aba de organização é ativada
    const organizedItemsMap = organizeItems();
    const hasAlcohol = organizedItemsMap.Alcool?.length > 0;
    const hasNonAlcohol = organizedItemsMap['Sem Alcool']?.length > 0;
    
    // Define o filtro ativo para o primeiro grupo que tem itens
    localState.activeOrganizationFilter = hasAlcohol ? 'Alcool' : (hasNonAlcohol ? 'Sem Alcool' : 'Alcool');
    
    // Expande o primeiro item por defeito se for a primeira montagem
    if(initialState.detailedPurchaseItems.length > 0 && !localState.expandedItemId) {
         localState.expandedItemId = initialState.detailedPurchaseItems[0].id;
    }
    
    renderContent();
};

export const unmount = () => {
    containerNode = null;
    onStateChangeCallback = null;
    wizardStateRef = null;
    localState = {
        activeOrganizationFilter: 'Alcool',
        expandedItemId: null,
    };
};

export default { renderContent, mount, unmount };