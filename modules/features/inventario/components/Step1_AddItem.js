// /modules/features/inventario/components/Step1_AddItem.js (NOVO COMPONENTE-FILHO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import { abrirModalConfirmacao } from '../../../shared/components/Modals.js';
import { formatarMoeda, debounce } from '../../../shared/lib/utils.js';

let localState = {
    catalogoGlobal: [],
    catalogoFiltrado: [],
    searchTerm: '',
    accordionsAbertos: {},
    itemSelecionado: null,
    detalhesItem: {
        embalagens: 1,
        unidadesPorEmbalagem: null,
        custoTotalItem: 0
    }
};

let onStateChangeCallback = null;
let wizardStateRef = null;
let containerNode = null;

async function carregarCatalogo() {
    localState.catalogoGlobal = store.getState().inventario
                                    .map(p => ({ id: p.id, nome: p.nome, tags: p.tags }))
                                    .sort((a, b) => a.nome.localeCompare(b.nome));
    localState.catalogoFiltrado = localState.catalogoGlobal;

    const categoriasPrincipais = store.getState().categoriasDeProduto.filter(c => c.isSystemDefault);
    localState.accordionsAbertos = {};
    if (categoriasPrincipais.length > 0) {
        localState.accordionsAbertos[categoriasPrincipais[0].id] = true;
    }
}

const filtrarCatalogo = debounce(() => {
    const termo = localState.searchTerm.toLowerCase();
    if (!termo) {
        localState.catalogoFiltrado = localState.catalogoGlobal;
    } else {
        localState.catalogoFiltrado = localState.catalogoGlobal.filter(p =>
            p.nome.toLowerCase().includes(termo)
        );
    }
    renderContent();
}, 300);

function getUnidadesPadrao(produto) {
    const nomeLower = produto.nome.toLowerCase();
    const tagLower = produto.tags?.[0]?.toLowerCase();

    if (tagLower === 'cerveja' && nomeLower.includes('garrafa')) return 24;
    if (tagLower === 'cerveja' && nomeLower.includes('lata')) return 12;
    if (tagLower === 'refrigerante' && nomeLower.includes('lata')) return 12;
    if (tagLower === 'refrigerante' && nomeLower.includes('garrafa')) return 12;
    if (tagLower === 'água' && nomeLower.includes('1.5l')) return 6;
    if (tagLower === 'água' && nomeLower.includes('0.5l')) return 12;
    if (tagLower === 'água' && nomeLower.includes('5l')) return 2;
    if (tagLower === 'energético') return 12;

    return 12;
}

function adicionarItemALista() {
    if (!localState.itemSelecionado || localState.detalhesItem.custoTotalItem <= 0 || localState.detalhesItem.embalagens <= 0 || localState.detalhesItem.unidadesPorEmbalagem <= 0) {
        Toast.mostrarNotificacao("Verifique a quantidade e o custo do item.", "erro");
        return;
    }

    const quantidadeTotal = localState.detalhesItem.embalagens * localState.detalhesItem.unidadesPorEmbalagem;
    let itensCompraAtualizados = [...wizardStateRef.itensCompra];
    const indexExistente = itensCompraAtualizados.findIndex(item => item.produtoId === localState.itemSelecionado.id);

    const novoItem = {
        produtoId: localState.itemSelecionado.id,
        nome: localState.itemSelecionado.nome,
        embalagens: localState.detalhesItem.embalagens,
        unidadesPorEmbalagem: localState.detalhesItem.unidadesPorEmbalagem,
        quantidadeTotal: quantidadeTotal,
        custoTotalItem: localState.detalhesItem.custoTotalItem
    };

    if (indexExistente > -1) {
        itensCompraAtualizados[indexExistente] = novoItem;
    } else {
        itensCompraAtualizados.push(novoItem);
    }

    localState.itemSelecionado = null;
    if (onStateChangeCallback) {
        onStateChangeCallback({ itensCompra: itensCompraAtualizados });
    }
}

function removerItemDaLista(produtoId) {
    const produto = wizardStateRef.itensCompra.find(item => item.produtoId === produtoId);
    if (!produto) return;

    abrirModalConfirmacao(
        `Remover ${produto.nome}?`,
        `Tem a certeza que deseja remover este item da compra?`,
        () => {
            const itensCompraAtualizados = wizardStateRef.itensCompra.filter(item => item.produtoId !== produtoId);
            if (onStateChangeCallback) {
                onStateChangeCallback({ itensCompra: itensCompraAtualizados });
            }
        }
    );
}

function renderContent() {
    if (!containerNode) return;
    const html = render();
    morphdom(containerNode, `
        <div id="${containerNode.id}">
            ${html}
        </div>
    `, { childrenOnly: true });
    attachListeners();
}

function attachListeners() {
    const buscaInput = containerNode.querySelector('#input-busca-catalogo-compra');
    buscaInput?.addEventListener('input', e => {
        localState.searchTerm = e.target.value;
        filtrarCatalogo();
    });

    const accordionsContainer = containerNode.querySelector('#catalogo-accordions-container');
    accordionsContainer?.addEventListener('click', e => {
        const itemButton = e.target.closest('.catalog-select-item');
        if (itemButton) {
            const produtoId = itemButton.dataset.produtoId;
            localState.itemSelecionado = localState.catalogoGlobal.find(p => p.id === produtoId);
            if (localState.itemSelecionado) {
                 localState.detalhesItem.unidadesPorEmbalagem = getUnidadesPadrao(localState.itemSelecionado);
                 localState.detalhesItem.embalagens = 1;
                 localState.detalhesItem.custoTotalItem = 0;
                 renderContent();
                 containerNode.querySelector('#detalhes-item-container')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    });

    const itensCompraList = containerNode.querySelector('#itens-compra-list');
    itensCompraList?.addEventListener('click', e => {
         const btnRemove = e.target.closest('.btn-remove-item');
         if (btnRemove) {
             const produtoId = btnRemove.closest('.purchase-item').dataset.produtoId;
             removerItemDaLista(produtoId);
         }
    });

    const detalhesContainer = containerNode.querySelector('#detalhes-item-container');
    detalhesContainer?.addEventListener('input', e => {
        if (e.target.id === 'input-nr-embalagens') localState.detalhesItem.embalagens = parseInt(e.target.value, 10) || 1;
        else if (e.target.id === 'input-unid-embalagem') localState.detalhesItem.unidadesPorEmbalagem = parseInt(e.target.value, 10) || 1;
        else if (e.target.id === 'input-custo-total-item') localState.detalhesItem.custoTotalItem = parseFloat(e.target.value) || 0;

        const qtdTotalEl = containerNode.querySelector('#detalhes-qtd-total');
        if (qtdTotalEl) {
            qtdTotalEl.textContent = (localState.detalhesItem.embalagens * localState.detalhesItem.unidadesPorEmbalagem) || 0;
        }
    });
     detalhesContainer?.addEventListener('click', e => {
        if (e.target.id === 'btn-add-item-to-list') {
            adicionarItemALista();
        }
    });
}

function render() {
    const state = store.getState();
    const categoriasPrincipais = state.categoriasDeProduto.filter(c => c.isSystemDefault);

    const totalProvisorio = wizardStateRef.itensCompra.reduce((total, item) => total + item.custoTotalItem, 0);

    const itensCompraHTML = wizardStateRef.itensCompra.length === 0
        ? '<p class="empty-list-message small">Nenhum item adicionado.</p>'
        : wizardStateRef.itensCompra.map(item => `
            <div class="list-item-condensed purchase-item" data-produto-id="${item.produtoId}">
                <span>${item.nome} - ${item.quantidadeTotal} un.</span>
                <div class="purchase-item-actions">
                    <span>${formatarMoeda(item.custoTotalItem)}</span>
                    <button type="button" class="button-icon small delete btn-remove-item" title="Remover Item"><i class="lni lni-trash-can"></i></button>
                </div>
            </div>
        `).join('');

    const accordionsHTML = categoriasPrincipais.map(catPai => {
        const produtosCategoria = localState.catalogoFiltrado.filter(p => {
            const subcategoria = state.categoriasDeProduto.find(cs => cs.nome.toLowerCase() === p.tags?.[0]?.toLowerCase());
            return subcategoria?.parentId === catPai.id;
        });

        if (produtosCategoria.length === 0 && localState.searchTerm) return '';

        const itemsHTML = produtosCategoria.map(p => `
            <button type="button" class="button-list-item catalog-select-item" data-produto-id="${p.id}">
                 <span>${p.nome}</span>
            </button>
        `).join('');

        return `
            <details class="accordion-item" open>
                <summary class="accordion-header">
                    <h4 class="accordion-title">${catPai.nome}</h4>
                    <i class="accordion-icon lni lni-chevron-down"></i>
                </summary>
                <div class="accordion-content">
                    ${itemsHTML || '<p class="empty-list-message small">Nenhum produto nesta categoria.</p>'}
                </div>
            </details>
        `;
    }).join('');

    const detalhesItemHTML = localState.itemSelecionado ? `
        <div class="card item-details-section">
            <h4 class="item-details-title">Detalhes: ${localState.itemSelecionado.nome}</h4>
            <div class="form-grid-2-col">
                <div class="form-group">
                    <label for="input-nr-embalagens" class="form-label">Nr. Embalagens</label>
                    <input type="number" id="input-nr-embalagens" class="input-field" min="1" value="${localState.detalhesItem.embalagens}">
                </div>
                <div class="form-group">
                    <label for="input-unid-embalagem" class="form-label">Unid./Emb.</label>
                    <input type="number" id="input-unid-embalagem" class="input-field" min="1" value="${localState.detalhesItem.unidadesPorEmbalagem || ''}">
                </div>
            </div>
            <div class="form-group">
                <label>Qtd. Total: <strong id="detalhes-qtd-total">${(localState.detalhesItem.embalagens * localState.detalhesItem.unidadesPorEmbalagem) || 0}</strong></label>
            </div>
            <div class="form-group">
                <label for="input-custo-total-item" class="form-label">Custo Total (Item) Kz</label>
                <input type="number" id="input-custo-total-item" class="input-field" min="0" step="any" value="${localState.detalhesItem.custoTotalItem > 0 ? localState.detalhesItem.custoTotalItem : ''}">
            </div>
            <button type="button" id="btn-add-item-to-list" class="button button-primary full-width">+ Adicionar à Compra</button>
        </div>
    ` : '';

    return `
        <div class="form-group">
            <label class="form-label">Itens Nesta Compra</label>
            <div id="itens-compra-list" class="list-container bordered">
                ${itensCompraHTML}
            </div>
            <div class="total-provisorio">Total Provisório: <strong>${formatarMoeda(totalProvisorio)}</strong></div>
        </div>
        <div class="form-group">
             <label class="form-label">Selecionar Itens do Catálogo</label>
             <input type="search" id="input-busca-catalogo-compra" class="input-field" placeholder="Buscar em Todo Catálogo..." value="${localState.searchTerm}">
             <div id="catalogo-accordions-container" class="accordions-container">
                 ${accordionsHTML || '<p class="empty-list-message">Catálogo vazio ou nenhum resultado.</p>'}
             </div>
        </div>
        <div id="detalhes-item-container">
             ${detalhesItemHTML}
        </div>
    `;
}

export const mount = async (container, initialState, onStateChange) => {
    containerNode = container;
    wizardStateRef = initialState;
    onStateChangeCallback = onStateChange;

    await carregarCatalogo();
    containerNode.innerHTML = render();
    attachListeners();
};

export const unmount = () => {
    containerNode = null;
    onStateChangeCallback = null;
    wizardStateRef = null;
    localState = {
        catalogoGlobal: [], catalogoFiltrado: [], searchTerm: '', accordionsAbertos: {},
        itemSelecionado: null, detalhesItem: { embalagens: 1, unidadesPorEmbalagem: null, custoTotalItem: 0 }
    };
};

export default { render, mount, unmount };