// /modules/features/inventario/components/Step1_ProductSelection.js (REFATORADO - Usa o ProductSelectionSheet via Modals.js)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import { debounce } from '../../../shared/lib/utils.js';
// Importa a função específica para abrir o sheet e a função para fechar
import { abrirProductSelectionSheet, closeSheet } from '../../../shared/components/Modals.js';

let containerNode = null; // Referência ao container do componente
let onStateChangeCallback = null; // Callback para notificar o wizard de mudanças no estado
let wizardStateRef = null; // Referência ao estado global do wizard
let allCatalogProducts = []; // Cache local dos produtos do catálogo

// Estado local específico do Passo 1
let localState = {
    activeParentId: null, // ID da Categoria Principal ativa (ex: sys_alcool)
    activeCategoryId: null, // ID da Subcategoria ativa (ex: id de 'Cerveja')
    searchTerm: '', // Termo atual da busca
};


// --- Funções Auxiliares ---

/**
 * Retorna as subcategorias de uma categoria principal.
 * @param {string | null} parentId - ID da categoria principal.
 * @returns {Array} Array de objetos de subcategoria.
 */
function getSubcategories(parentId) {
    if (!parentId) return []; // Retorna array vazio se parentId for nulo
    // Filtra as categorias do store global
    return store.getState().categoriasDeProduto.filter(c => c.parentId === parentId && !c.isSystemDefault);
}

/**
 * Lida com a adição ou remoção de um produto da lista de seleção do wizard.
 * Atualiza o estado do wizard e a UI local.
 * @param {string} produtoId - ID do produto a adicionar/remover.
 * @param {boolean} isAdding - True se for para adicionar, false para remover.
 */
function handleProductSelect(produtoId, isAdding) {
    // Encontra o produto completo no catálogo local
    const produto = allCatalogProducts.find(p => p.id === produtoId);
    if (!produto) return; // Sai se o produto não for encontrado

    // Cria uma cópia imutável da lista de itens selecionados do wizard
    let newSelectedItems = [...wizardStateRef.selectedCatalogItems];

    if (isAdding) {
        // Verifica se o item já existe na lista antes de adicionar
        if (!newSelectedItems.some(i => i.id === produto.id)) {
            // Cria o objeto do item a ser adicionado ao estado do wizard
            const itemToAdd = {
                id: produto.id,
                nome: produto.nome,
                tags: produto.tags,
                // Passa o preço de venda anterior para inicialização do Passo 2
                // Usa 'undefined' se for null para evitar problemas com inputs numéricos
                precoVendaAnterior: produto.precoVenda !== null ? produto.precoVenda : undefined
            };
            newSelectedItems.push(itemToAdd);
            Toast.mostrarNotificacao(`"${produto.nome}" adicionado.`); // Feedback para o utilizador
        } else {
             // Informa se o item já foi adicionado
             Toast.mostrarNotificacao(`"${produto.nome}" já está na lista.`, "info");
        }
    } else {
        // Remove o item da lista
        const initialLength = newSelectedItems.length;
        newSelectedItems = newSelectedItems.filter(item => item.id !== produto.id);
        // Só mostra notificação se realmente removeu
        if (newSelectedItems.length < initialLength) {
            Toast.mostrarNotificacao(`"${produto.nome}" removido.`);
        }
    }

    // Notifica o componente pai (Wizard) sobre a mudança na lista de selecionados
    if (onStateChangeCallback) {
        onStateChangeCallback({ selectedCatalogItems: newSelectedItems });
    }

    // Re-renderiza APENAS a lista de itens selecionados (performance)
    renderSelectedItemsList();
    // A atualização do estado visual do sheet (checkmark) é tratada internamente pelo ProductSelectionSheet
}

/**
 * Prepara os dados e abre o ProductSelectionSheet para uma subcategoria específica.
 * @param {string} categoryId - ID da subcategoria cujos produtos serão mostrados.
 */
function openSelectionSheet(categoryId) {
    const state = store.getState();
    // Encontra o objeto da categoria selecionada
    const categoria = state.categoriasDeProduto.find(c => c.id === categoryId);
    if (!categoria) return; // Sai se a categoria não for encontrada

    const subcategoryName = categoria.nome.toLowerCase();

    // Filtra o catálogo global pelos produtos que pertencem a esta subcategoria
    const sheetProducts = allCatalogProducts
        .filter(p => p.tags && p.tags.some(tag => tag.toLowerCase() === subcategoryName))
        .sort((a, b) => a.nome.localeCompare(b.nome)); // Ordena alfabeticamente

    // Mapeia os produtos para o formato {id, nome, isSelected} que o sheet espera
    const selectedIds = new Set(wizardStateRef.selectedCatalogItems.map(i => i.id));
    const productsForSheet = sheetProducts.map(p => ({
        id: p.id,
        nome: p.nome,
        isSelected: selectedIds.has(p.id) // Indica se o produto já está na lista do wizard
    }));

    // Define o callback que será chamado QUANDO um item for clicado DENTRO do sheet
    const onSheetUpdate = (produto, isAdding) => {
        // Chama a função principal de adicionar/remover item
        handleProductSelect(produto.id, isAdding);
    };

    // Abre o sheet usando a função importada de Modals.js
    abrirProductSelectionSheet(productsForSheet, `Selecionar ${categoria.nome}`, onSheetUpdate);
}

/**
 * Prepara os dados e abre o ProductSelectionSheet com os resultados da busca.
 * @param {string} term - O termo de busca.
 */
function openSearchSheet(term) {
    const state = store.getState();
    const termoLower = term.toLowerCase();

    // Filtra o catálogo global pelo termo de busca
    const sheetProducts = allCatalogProducts
        .filter(p => p.nome.toLowerCase().includes(termoLower))
        .sort((a, b) => a.nome.localeCompare(b.nome)); // Ordena alfabeticamente

    // Mapeia para o formato {id, nome, isSelected}
    const selectedIds = new Set(wizardStateRef.selectedCatalogItems.map(i => i.id));
    const productsForSheet = sheetProducts.map(p => ({
        id: p.id,
        nome: p.nome,
        isSelected: selectedIds.has(p.id)
    }));

    // Callback para quando um item é clicado DENTRO do sheet
    const onSheetUpdate = (produto, isAdding) => {
        handleProductSelect(produto.id, isAdding);
    };

    // Abre o sheet via Modals.js com o título indicando a busca
    abrirProductSelectionSheet(productsForSheet, `Resultados para "${term}"`, onSheetUpdate);
}


// --- Funções de Renderização do Passo ---

/**
 * Renderiza APENAS a lista de itens selecionados dentro do seu container.
 * Otimizado para ser chamado via morphdom ou diretamente.
 */
function renderSelectedItemsList() {
    const listContainer = containerNode?.querySelector('#selected-items-list');
    if (!listContainer) return; // Sai se o container não for encontrado

    // Renderiza mensagem de vazio ou a lista de cards
    if (wizardStateRef.selectedCatalogItems.length === 0) {
        listContainer.innerHTML = `<p class="empty-list-message small">Nenhum item selecionado. Use a busca ou os filtros para adicionar produtos.</p>`;
    } else {
        const itemsHTML = wizardStateRef.selectedCatalogItems.map(item => {
            // Verifica se este item já teve seus detalhes preenchidos no Passo 2 (visual)
            const isDetailed = wizardStateRef.detailedPurchaseItems.some(di => di.id === item.id);
            return `
                <div class="card catalog-select-card" data-produto-id="${item.id}">
                    <div class="product-info-display">
                        <span class="product-icon-placeholder"></span>
                        <span class="product-name">${item.nome}</span>
                    </div>
                    ${isDetailed ? '<i class="lni lni-checkmark-circle text-success" title="Detalhes Preenchidos"></i>' : ''}
                    <button class="button-icon delete-item-btn" data-id="${item.id}" title="Remover item">
                        <i class="lni lni-trash-can"></i>
                    </button>
                </div>
            `;
        }).join('');
        listContainer.innerHTML = itemsHTML;
    }
    // Atualiza o contador no header do card de itens selecionados
    const header = containerNode?.querySelector('#selected-items-card-header');
    if(header) header.textContent = `Itens Selecionados (${wizardStateRef.selectedCatalogItems.length})`;
}


/**
 * Renderiza os chips de filtro (categorias principais e subcategorias).
 * @param {Array} categoriasPrincipais - Array das categorias principais (Álcool, Sem Álcool).
 * @returns {string} HTML dos filtros.
 */
function renderFilterChips(categoriasPrincipais) {
    const state = store.getState();

    // Gera HTML para os botões das categorias principais
    const parentChipsHTML = categoriasPrincipais.map(cp => `
         <button class="filter-chip parent-chip ${cp.id === localState.activeParentId ? 'active' : ''}" data-parent-id="${cp.id}">
            ${cp.nome}
         </button>
    `).join('');

    // Gera HTML para os botões das subcategorias da categoria principal ativa
    const subcategoriesHTML = localState.activeParentId ? getSubcategories(localState.activeParentId).map(sc => `
        <button class="filter-chip subcategory-chip ${localState.activeCategoryId === sc.id ? 'active' : ''}" data-id="${sc.id}">
            ${sc.nome}
        </button>
    `).join('') : '';

    // Retorna o HTML das duas barras de filtro
    return `
        <div class="filter-bar" id="parent-chip-group">${parentChipsHTML}</div>
        <div class="filter-bar" id="subcategory-chip-group" style="padding-top: 0; padding-bottom: var(--space-4);">${subcategoriesHTML}</div>
    `;
}


/**
 * Renderiza a estrutura HTML principal do Passo 1.
 * @returns {string} HTML completo do Passo 1.
 */
function render() {
    // Obtém as categorias principais do estado global
    const categoriasPrimarias = store.getState().categoriasDeProduto.filter(c => c.isSystemDefault);

    // Retorna o layout principal do Passo 1
    return `
        <div class="step1-controls" style="padding: 0 var(--space-4);">
            <input type="search" id="input-global-search" class="search-input pill-style" placeholder="pesquise por um produto" value="${localState.searchTerm}">
            <div class="filter-chip-container" style="display: flex; flex-direction: column;">
                 ${renderFilterChips(categoriasPrimarias)}
            </div>
        </div>

        <div class="card" style="margin: 0 var(--space-4);">
            <div class="card-header" id="selected-items-card-header">Itens Selecionados (${wizardStateRef.selectedCatalogItems.length})</div>
            <div class="card-body-list" id="selected-items-list" style="padding-top: var(--space-2); padding-bottom: var(--space-2);">
              
            </div>
        </div>

        <div class="card" style="margin: var(--space-4); margin-top: 0; background-color: var(--bg-tertiary);">
            <div class="card-body-list empty-state-container small">
                <p>Clique numa subcategoria acima ou use a busca para abrir a folha de seleção.</p>
            </div>
        </div>
    `;
}

/**
 * Renderiza a estrutura completa do passo e anexa os listeners principais.
 * Usa morphdom para atualizações eficientes da estrutura principal.
 */
function renderContent() {
    if (!containerNode) return; // Sai se o container não foi definido
    const newHTML = render(); // Gera o novo HTML da estrutura

    // Usa morphdom para aplicar as diferenças ao DOM existente
    morphdom(containerNode, `
        <div id="${containerNode.id}" class="step1-container">
            ${newHTML}
        </div>
    `, { childrenOnly: true }); // Atualiza apenas os filhos do container

    // Renderiza a lista de itens selecionados separadamente após a estrutura ser atualizada
    renderSelectedItemsList();
    attachListeners(); // Reanexa os listeners principais
}

/**
 * Anexa os listeners de evento principais ao container do Passo 1.
 */
function attachListeners() {
    const searchInput = containerNode.querySelector('#input-global-search');

    // Debounce para a Busca Global - AGORA ABRE O SHEET
    const handleSearch = debounce((e) => {
        localState.searchTerm = e.target.value;
        // Limpa o filtro de categoria ao fazer a busca
        if(localState.searchTerm.length >= 2) { // Só abre se tiver termo suficiente
            localState.activeParentId = null;
            localState.activeCategoryId = null;
            renderContent(); // Atualiza os filtros visuais para remover o estado 'active'
            openSearchSheet(localState.searchTerm); // Abre o sheet com resultados da busca
        } else {
             closeSheet(); // Fecha o sheet se o termo for apagado/muito curto
             renderContent(); // Atualiza UI (remove estado ativo dos filtros)
        }
    }, 400); // Delay de 400ms após parar de digitar
    searchInput?.removeEventListener('input', handleSearch); // Remove listener antigo para evitar duplicação
    searchInput?.addEventListener('input', handleSearch); // Adiciona o novo listener


    // Remove listener de clique antigo para evitar duplicação
    containerNode.removeEventListener('click', handleContainerClick);
    // Adiciona o novo listener de clique usando delegação
    containerNode.addEventListener('click', handleContainerClick);
}

/**
 * Handler principal para cliques no container do Passo 1 (delegação).
 * @param {Event} e - O evento de clique.
 */
const handleContainerClick = (e) => {
    // 1. Clicou no chip de Categoria Principal (ex: Álcool)
    const parentChip = e.target.closest('.parent-chip');
    if (parentChip) {
        const newParentId = parentChip.dataset.parentId;
        const subcategories = getSubcategories(newParentId);

        // Define a nova categoria principal ativa
        localState.activeParentId = newParentId;
        // Seleciona a primeira subcategoria como ativa (ou null se não houver)
        localState.activeCategoryId = subcategories[0]?.id || null;
        localState.searchTerm = ''; // Limpa o termo de busca
        renderContent(); // Atualiza a UI para mostrar os chips ativos

        // Abre o sheet se houver uma subcategoria selecionada
        if (localState.activeCategoryId) {
            openSelectionSheet(localState.activeCategoryId);
        } else {
            closeSheet(); // Fecha o sheet se não houver subcategorias
        }
        return; // Finaliza o handler
    }

    // 2. Clicou no chip de Subcategoria (ex: Cerveja) -> ABRE O SHEET
    const subcategoryChip = e.target.closest('.subcategory-chip');
    if (subcategoryChip) {
        localState.activeCategoryId = subcategoryChip.dataset.id;
        localState.searchTerm = ''; // Limpa o termo de busca
        renderContent(); // Atualiza a UI para mostrar o chip ativo
        // Abre o sheet para a subcategoria clicada
        openSelectionSheet(localState.activeCategoryId);
        return; // Finaliza o handler
    }

    // 3. Clicou para remover um item selecionado (ícone de lixeira)
    const deleteBtn = e.target.closest('.delete-item-btn');
    if (deleteBtn) {
        // Chama a função para remover o item do estado do wizard
        handleProductSelect(deleteBtn.dataset.id, false); // Passa false para indicar remoção
        return; // Finaliza o handler
    }
}

// --- Funções `mount` e `unmount` Exportadas ---

/**
 * Monta o componente do Passo 1.
 * @param {HTMLElement} container - O elemento DOM onde o passo será renderizado.
 * @param {object} initialState - O estado atual do wizard.
 * @param {Function} onStateChange - Callback para notificar o wizard sobre mudanças.
 */
export const mount = async (container, initialState, onStateChange) => {
    containerNode = container;
    wizardStateRef = initialState;
    onStateChangeCallback = onStateChange;

    // Carrega o catálogo de produtos do estado global para o cache local
    allCatalogProducts = store.getState().inventario.map(p => ({
        id: p.id, nome: p.nome, tags: p.tags, precoVenda: p.precoVenda
    }));

    // Define o estado inicial dos filtros: seleciona "Álcool" e sua primeira subcategoria
    const categoriasPrimarias = store.getState().categoriasDeProduto.filter(c => c.isSystemDefault);
    const alcoolId = categoriasPrimarias.find(c => c.nome.toLowerCase() === 'alcool')?.id;
    const primeiraSubcatAlcool = getSubcategories(alcoolId)[0]?.id;

    localState.activeParentId = alcoolId || categoriasPrimarias[0]?.id || null; // Fallback para a primeira categoria principal
    localState.activeCategoryId = primeiraSubcatAlcool || null; // Fallback para nenhuma subcategoria ativa
    localState.searchTerm = ''; // Garante que a busca esteja limpa

    renderContent(); // Renderiza a UI inicial completa
};

/**
 * Desmonta o componente do Passo 1, limpando listeners e estado local.
 */
export const unmount = () => {
    // Remove o listener de clique principal
    containerNode?.removeEventListener('click', handleContainerClick);
    // Remove o listener de busca (embora debounce possa complicar, tentamos remover)
    const searchInput = containerNode?.querySelector('#input-global-search');
    // Idealmente, a função handleSearch deveria ser guardada numa variável para remoção precisa.
    // Como alternativa simples, clonar o nó removeria todos os listeners.
    if(searchInput) searchInput.replaceWith(searchInput.cloneNode(true));

    // Garante que o sheet seja fechado ao sair do passo/modal
    closeSheet();

    // Limpa as referências e o estado local
    containerNode = null;
    onStateChangeCallback = null;
    wizardStateRef = null;
    localState = { activeParentId: null, activeCategoryId: null, searchTerm: '' };
};

export default { render, mount, unmount }; // Exporta as funções públicas