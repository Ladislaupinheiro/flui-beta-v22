// /modules/features/inventario/components/FormAddProdutoModal.js (REFATORADO PARA GESTÃO DO CATÁLOGO GLOBAL)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import { abrirModalGerirCategorias, abrirModalAddSubcategoria } from '../../../shared/components/Modals.js'; // Mantém abrirModalAddSubcategoria

// Estado local para o formulário
let formData = {
    id: null, // Para modo de edição
    nome: '',
    categoriaPaiId: null,
    tag: '', // Nome da subcategoria (string)
    stockMinimo: 12
};

function renderSubcategoriasChips() {
    const state = store.getState();
    const subcategorias = state.categoriasDeProduto.filter(cat => cat.parentId === formData.categoriaPaiId && !cat.isSystemDefault); // Apenas subcategorias criadas pelo user
    return subcategorias.map(sc =>
        `<button type="button" class="filter-chip ${formData.tag === sc.nome.toLowerCase() ? 'active' : ''}" data-tag="${sc.nome.toLowerCase()}">${sc.nome}</button>`
    ).join('');
}

/**
 * Atualiza a variável CSS '--progress-percent' de um input range
 * para preencher visualmente o fundo até ao valor atual.
 * @param {HTMLInputElement} slider - O elemento input do tipo range.
 */
const updateSliderProgress = (slider) => {
    if (!slider) return;
    const progress = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.setProperty('--progress-percent', `${progress}%`);
};


export const render = (produtoParaEditar = null) => {
    const isEditing = !!produtoParaEditar;
    const state = store.getState();
    const categoriasPrimarias = state.categoriasDeProduto.filter(cat => cat.isSystemDefault);

    // Inicializa ou preenche formData
    if (isEditing) {
        const categoriaPai = state.categoriasDeProduto.find(cp =>
            state.categoriasDeProduto.some(cs => cs.parentId === cp.id && cs.nome.toLowerCase() === (produtoParaEditar.tags?.[0] || '').toLowerCase())
        );
        formData = {
            id: produtoParaEditar.id,
            nome: produtoParaEditar.nome || '',
            categoriaPaiId: categoriaPai?.id || categoriasPrimarias[0]?.id || null,
            tag: produtoParaEditar.tags?.[0] || '',
            stockMinimo: produtoParaEditar.stockMinimo || 12
        };
    } else {
        // Reset para adicionar
        formData = {
            id: null, nome: '',
            categoriaPaiId: categoriasPrimarias[0]?.id || null, // Seleciona a primeira por defeito
            tag: '', stockMinimo: 12
        };
    }

    return `
<div id="modal-add-produto-overlay" class="modal-overlay">
    <form id="form-add-produto-catalogo" class="modal-container">
        <header class="modal-header">
            <h3 class="modal-title">${isEditing ? 'Editar Produto no Catálogo' : 'Adicionar Produto ao Catálogo'}</h3>
            <button type="button" class="modal-close-button">&times;</button>
        </header>

        <div class="modal-body">
            {/* --- Campos do Formulário --- */}
            <div class="form-group">
                <label for="input-produto-nome-catalogo" class="form-label">Nome do Produto</label>
                <input type="text" id="input-produto-nome-catalogo" required class="input-field" placeholder="Ex: Cerveja Cuca (Garrafa)" value="${formData.nome}">
            </div>
            <div class="form-group">
                <label class="form-label">Categoria Principal</label>
                <div id="cat-pai-group-catalogo" class="segmented-control-group">
                    ${categoriasPrimarias.map(cp => `<button type="button" class="segmented-control-button ${formData.categoriaPaiId === cp.id ? 'active' : ''}" data-cat-id="${cp.id}">${cp.nome}</button>`).join('')}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Subcategoria</label>
                <div id="subcat-chip-group-catalogo" class="chip-group">${renderSubcategoriasChips()}</div>
                <button type="button" id="btn-add-subcategoria-inline-catalogo" class="button button-secondary dashed small">+ Criar Subcategoria</button>
            </div>
             <div class="form-group">
                <label for="range-stock-minimo-catalogo" class="form-label">Stock Mínimo Padrão (Alerta): <span id="stock-minimo-value" class="font-bold">${formData.stockMinimo}</span></label>
                <input type="range" id="range-stock-minimo-catalogo" min="0" max="100" step="1" value="${formData.stockMinimo}" class="input-range">
                 <div class="slider-markers"><span>0</span><span>100</span></div>
            </div>
        </div>

        <footer id="modal-footer-container" class="modal-footer">
            <button type="submit" class="button ${isEditing ? 'button-primary' : 'button-success'} full-width">
                ${isEditing ? 'Salvar Alterações' : 'Adicionar ao Catálogo'}
            </button>
        </footer>
    </form>
</div>`;
};

export const mount = (closeModal, produtoParaEditar = null) => {
    const overlay = document.getElementById('modal-add-produto-overlay');
    const form = document.getElementById('form-add-produto-catalogo');
    const nomeInput = form.querySelector('#input-produto-nome-catalogo');
    const catPaiGroup = form.querySelector('#cat-pai-group-catalogo');
    const subcatChipGroup = form.querySelector('#subcat-chip-group-catalogo');
    const stockMinimoSlider = form.querySelector('#range-stock-minimo-catalogo');
    const stockMinimoValue = form.querySelector('#stock-minimo-value');

    // Foca o campo nome ao abrir
    nomeInput?.focus();
    // Aplica o estilo inicial ao slider
    updateSliderProgress(stockMinimoSlider);

    // Listener para Categoria Principal
    catPaiGroup?.addEventListener('click', e => {
        const target = e.target.closest('[data-cat-id]');
        if (!target) return;
        formData.categoriaPaiId = target.dataset.catId;
        formData.tag = ''; // Reseta subcategoria ao mudar a principal
        // Re-renderiza botões de categoria pai e chips de subcategoria
        catPaiGroup.querySelectorAll('.segmented-control-button').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');
        subcatChipGroup.innerHTML = renderSubcategoriasChips();
    });

    // Listener para Subcategoria (Chips)
    subcatChipGroup?.addEventListener('click', e => {
        const target = e.target.closest('[data-tag]');
        if (!target) return;
        formData.tag = target.dataset.tag;
        // Re-renderiza chips para mostrar seleção
        subcatChipGroup.innerHTML = renderSubcategoriasChips();
    });

    // Listener para Botão "+ Criar Subcategoria"
    form.querySelector('#btn-add-subcategoria-inline-catalogo')?.addEventListener('click', () => {
        if (formData.categoriaPaiId) {
            // Abre o modal de adicionar subcategoria, passando o ID da pai selecionada
            abrirModalAddSubcategoria(formData.categoriaPaiId);
            // NOTA: O `subscribe` no `CatalogoGlobalView` (ou onde este modal for chamado)
            // deve re-renderizar a lista/modal para incluir a nova subcategoria.
            // Para atualizar *imediatamente* os chips aqui, precisaríamos de um callback
            // ou re-renderizar o modal inteiro via store.subscribe.
            // Por simplicidade, vamos assumir que o usuário selecionará a nova tag após ser criada.
        } else {
            Toast.mostrarNotificacao("Selecione uma Categoria Principal primeiro.", "info");
        }
    });

    // Listener para Slider de Stock Mínimo
    stockMinimoSlider?.addEventListener('input', e => {
        formData.stockMinimo = parseInt(e.target.value, 10);
        if (stockMinimoValue) stockMinimoValue.textContent = formData.stockMinimo;
        updateSliderProgress(e.target); // Atualiza visual do slider
    });

    // Listener para Input de Nome (Atualiza formData)
    nomeInput?.addEventListener('input', e => {
        formData.nome = e.target.value;
    });


    // Submissão do Formulário
    form.addEventListener('submit', e => {
        e.preventDefault();
        const nomeFinal = formData.nome.trim(); // Usa o nome do formData atualizado pelo input listener

        // Validação
        if (!nomeFinal || !formData.tag) {
            return Toast.mostrarNotificacao("Nome e Subcategoria são obrigatórios.", "erro");
        }

        const produtoData = {
            id: formData.id, // Será null se for Add, terá ID se for Edit
            nome: nomeFinal,
            tags: [formData.tag.toLowerCase()], // Salva como array
            stockMinimo: formData.stockMinimo
            // Não inclui preço nem stock
        };

        if (formData.id) {
            // Modo Edição
            store.dispatch({ type: 'UPDATE_PRODUCT', payload: produtoData });
            Toast.mostrarNotificacao(`Produto "${nomeFinal}" atualizado no catálogo.`);
        } else {
            // Modo Adição
             // Verifica duplicados antes de adicionar
            if (store.getState().inventario.some(p => p.nome.toLowerCase() === nomeFinal.toLowerCase())) {
                 return Toast.mostrarNotificacao(`Produto "${nomeFinal}" já existe no catálogo.`, "erro");
            }
            store.dispatch({ type: 'ADD_PRODUCT', payload: produtoData });
            Toast.mostrarNotificacao(`Produto "${nomeFinal}" adicionado ao catálogo.`);
        }
        closeModal();
    });

    // Botão de Fechar e Overlay Click
    form.querySelector('.modal-close-button').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
};

export const unmount = () => {
    // Reset formData ao desmontar para garantir estado limpo
    formData = { id: null, nome: '', categoriaPaiId: null, tag: '', stockMinimo: 12 };
};