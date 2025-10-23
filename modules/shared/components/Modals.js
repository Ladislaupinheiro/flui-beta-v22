// /modules/shared/components/Modals.js (CORREÇÃO ARQUITETÓNICA: Adiciona ProductSelectionSheet)
'use strict';

import store from '../services/Store.js';

import * as BackupRestoreModal from '../../features/settings/components/BackupRestoreModal.js';
import * as ConfirmacaoModal from '../ui/ConfirmacaoModal.js';
import * as CustomerPerformanceModal from '../../features/clientes/components/CustomerPerformanceModal.js';
import * as DicaDoDiaModal from '../../features/dashboard/components/DicaDoDiaModal.js';
import * as FechoGlobalModal from '../../features/financas/components/FechoGlobalModal.js';
import * as FormAddClienteModal from '../../features/clientes/components/FormAddClienteModal.js';
import * as FormAddDividaModal from '../../features/clientes/components/FormAddDividaModal.js';
import * as FormAddFornecedorModal from '../../features/inventario/components/FormAddFornecedorModal.js';
import * as FormAddPedidoModal from '../../features/atendimento/components/FormAddPedidoModal.js';
import * as FormAddProdutoModal from '../../features/inventario/components/FormAddProdutoModal.js';
import * as FormAddStockModal from '../../features/inventario/components/FormAddStockModal.js';
import * as FormAddSubcategoriaModal from '../../features/inventario/components/FormAddSubcategoriaModal.js';
import * as FormEditBusinessNameModal from '../../features/dashboard/components/FormEditBusinessNameModal.js';
import * as FormEditClienteModal from '../../features/clientes/components/FormEditClienteModal.js';
import * as FormEditFornecedorModal from '../../features/inventario/components/FormEditFornecedorModal.js';
import * as FormEditProdutoModal from '../../features/inventario/components/FormEditProdutoModal.js';
import * as FormExportarComprasModal from '../../features/financas/components/FormExportarComprasModal.js';
import * as FormGerirCategoriasModal from '../../features/inventario/components/FormGerirCategoriasModal.js';
import * as FormLiquidarDividaModal from '../../features/clientes/components/FormLiquidarDividaModal.js';
import * as FormMoverStockModal from '../../features/inventario/components/FormMoverStockModal.js';
import * as FormNovaContaModal from '../../features/atendimento/components/FormNovaContaModal.js';
import * as FormNovaDespesaModal from '../../features/financas/components/FormNovaDespesaModal.js';
import * as FormPagamentoModal from '../../features/atendimento/components/FormPagamentoModal.js';
import * as ProductPerformanceModal from '../../features/inventario/components/ProductPerformanceModal.js';
import * as FormRegistarCompraModal from '../../features/inventario/components/FormRegistarCompraModal.js';
import * as ShortcutManagementModal from '../../features/inventario/components/ShortcutManagementModal.js';
import * as ModalFiltroSubcategoria from '../../features/inventario/components/ModalFiltroSubcategoria.js';
import * as ModalSeletorQuantidade from '../../features/atendimento/components/ModalSeletorQuantidade.js';
import * as ModalAcoesPedido from '../../features/atendimento/components/ModalAcoesPedido.js';
import * as ModalAcoesFlutuantes from '../../features/atendimento/components/ModalAcoesFlutuantes.js';
import * as ModalTrocarCliente from '../../features/atendimento/components/ModalTrocarCliente.js';
import * as ProductSelectionSheet from './ProductSelectionSheet.js'; // <-- NOVA IMPORTAÇÃO

const modalComponents = {
    BackupRestoreModal, ConfirmacaoModal, CustomerPerformanceModal, DicaDoDiaModal, FechoGlobalModal,
    FormAddClienteModal, FormAddDividaModal, FormAddFornecedorModal, FormAddPedidoModal, FormAddProdutoModal,
    FormAddStockModal, FormAddSubcategoriaModal, FormEditBusinessNameModal, FormEditClienteModal, FormEditFornecedorModal,
    FormEditProdutoModal, FormExportarComprasModal, FormGerirCategoriasModal, FormLiquidarDividaModal,
    FormMoverStockModal, FormNovaContaModal, FormNovaDespesaModal, FormPagamentoModal, ModalAcoesFlutuantes,
    ModalAcoesPedido, ModalFiltroSubcategoria, ModalSeletorQuantidade, ModalTrocarCliente, ProductPerformanceModal,
    FormRegistarCompraModal, ShortcutManagementModal,
    ProductSelectionSheet, // <-- NOVO COMPONENTE
};

let modalsContainer = null;
let appRoot = null;
let activeModal = { close: () => {} };
let activeSheet = { close: () => {} }; // <-- NOVO: Gerencia sheets que não fecham o modal pai

// Função auxiliar para fechar o sheet atual
function closeSheet() {
    if (typeof activeSheet.close === 'function') {
        activeSheet.close();
    }
    activeSheet = { close: () => {} };
}

/**
 * Abre um modal padrão que desfoca o fundo.
 * Fecha qualquer modal ou sheet ativo antes de abrir o novo.
 * @param {string} modalName - Nome do componente modal a abrir.
 * @param {Array} [renderArgs=[]] - Argumentos para a função `render`.
 * @param {Array} [mountArgs=[]] - Argumentos para a função `mount` (excluindo `closeModal`).
 */
async function openModal(modalName, renderArgs = [], mountArgs = []) {
    // Fecha modal ou sheet ativo
    if (typeof activeModal.close === 'function') {
        activeModal.close();
    }
    closeSheet(); // Garante que sheets também sejam fechados

    const component = modalComponents[modalName];
    if (!component) {
        console.error(`Falha ao abrir modal: Componente "${modalName}" inválido.`);
        return;
    }

    if (!modalsContainer || !appRoot) {
        console.error("Falha ao abrir modal: Containers não inicializados.");
        return;
    }

    appRoot.classList.add('app-desfocada');
    modalsContainer.innerHTML = component.render(...renderArgs);

    const closeModal = (postCloseCallback) => {
        if (typeof component.unmount === 'function') {
            component.unmount();
        }
        if (modalsContainer) modalsContainer.innerHTML = '';
        if (appRoot) appRoot.classList.remove('app-desfocada');

        activeModal = { close: () => {} };

        if (typeof postCloseCallback === 'function') {
            setTimeout(postCloseCallback, 0);
        }
    };

    activeModal.close = closeModal;

    try {
        if (component.mount && typeof component.mount === 'function') {
            if (component.mount.constructor.name === 'AsyncFunction') {
                await component.mount(closeModal, ...mountArgs);
            } else {
                component.mount(closeModal, ...mountArgs);
            }
        }
    } catch (error) {
        console.error(`Erro ao montar o modal "${modalName}":`, error);
        closeModal();
    }
}

function init() {
    modalsContainer = document.getElementById('modals-container');
    appRoot = document.getElementById('app-root');
}

// --- Nova Função para Abrir o Bottom Sheet Persistente ---

/**
 * Abre um Bottom Sheet persistente que não fecha o modal pai (Wizard).
 * Fecha qualquer sheet ativo antes de abrir o novo.
 * @param {Array} products - Lista de produtos para seleção (formato {id, nome, isSelected}).
 * @param {string} title - Título da folha.
 * @param {Function} onUpdate - Callback (produto, isAdding) para atualizar o estado do pai.
 */
export function abrirProductSelectionSheet(products, title, onUpdate) {
    if (typeof activeSheet.close === 'function') {
        activeSheet.close(); // Fecha o sheet anterior
    }

    if (!modalsContainer) return console.error("Containers não inicializados.");

    // Renderiza o HTML do sheet (z-index maior)
    modalsContainer.insertAdjacentHTML('beforeend', ProductSelectionSheet.render(products, title, onUpdate));

    const closeSheetCallback = () => {
        ProductSelectionSheet.unmount();
        activeSheet = { close: () => {} };
    };

    activeSheet.close = closeSheetCallback;

    // Monta e anexa listeners ao sheet
    ProductSelectionSheet.mount(modalsContainer, closeSheetCallback);
}


// --- Exportações das Funções de Abertura ---

export function abrirModalAcoesFlutuantes(titulo, botoes) { openModal('ModalAcoesFlutuantes', [titulo, botoes], [titulo, botoes]); }
export function abrirModalAcoesPedido(pedido, onEdit, onRemove) { openModal('ModalAcoesPedido', [pedido], [onEdit, onRemove]); }
export function abrirModalAddCliente(onClientAddedCallback) { openModal('FormAddClienteModal', [], [onClientAddedCallback]); }
export function abrirModalAddDivida(cliente) { openModal('FormAddDividaModal', [cliente], [cliente]); }
export function abrirModalAddFornecedor(onSuccessCallback) { openModal('FormAddFornecedorModal', [], [onSuccessCallback]); }
export function abrirModalAddPedido(contaId) { const conta = store.getState().contasAtivas.find(c => c.id === contaId); if (conta) openModal('FormAddPedidoModal', [conta], [contaId]); }
export function abrirModalAddProduto(produtoParaEditar = null, onSuccessCallback = null) { openModal('FormAddProdutoModal', [produtoParaEditar], [produtoParaEditar, onSuccessCallback]); }
export function abrirModalAddStock(produto) { openModal('FormAddStockModal', [produto], [produto]); }
export function abrirModalAddSubcategoria(categoriaPaiId) { openModal('FormAddSubcategoriaModal', [categoriaPaiId], [categoriaPaiId]); }
export function abrirModalBackupRestore() { openModal('BackupRestoreModal'); }
export function abrirModalConfirmacao(titulo, mensagem, onConfirmCallback) { openModal('ConfirmacaoModal', [titulo, mensagem], [titulo, mensagem, onConfirmCallback]); }
export function abrirModalCustomerPerformance(customerInsights, periodo) { openModal('CustomerPerformanceModal', [customerInsights, periodo], [customerInsights, periodo]); }
export function abrirModalDicaDoDia(dica) { openModal('DicaDoDiaModal', [dica]); }
export function abrirModalEditBusinessName(nomeAtual) { openModal('FormEditBusinessNameModal', [nomeAtual], [nomeAtual]); }
export function abrirModalEditCliente(cliente) { openModal('FormEditClienteModal', [cliente], [cliente]); }
export function abrirModalEditFornecedor(fornecedor) { openModal('FormEditFornecedorModal', [fornecedor], [fornecedor]); }
export function abrirModalEditProduto(produto) { openModal('FormEditProdutoModal', [produto], [produto]); }
export function abrirModalExportarCompras() { openModal('FormExportarComprasModal'); }
export function abrirModalFechoGlobal(relatorio, isHistoric) { openModal('FechoGlobalModal', [relatorio, isHistoric], [relatorio, isHistoric]); }
export function abrirModalFiltroSubcategoria(subcategorias, nomeCategoriaPai, onSelectCallback) { openModal('ModalFiltroSubcategoria', [subcategorias, nomeCategoriaPai], [subcategorias, onSelectCallback]); }
export function abrirModalGerirCategorias() { openModal('FormGerirCategoriasModal'); }
export function abrirModalLiquidarDivida(cliente) { openModal('FormLiquidarDividaModal', [cliente], [cliente]); }
export function abrirModalMoverStock(produto) { openModal('FormMoverStockModal', [produto], [produto]); }
export function abrirModalNovaConta() { openModal('FormNovaContaModal'); }
export function abrirModalNovaDespesa() { openModal('FormNovaDespesaModal'); }
export function abrirModalPagamento(conta) { openModal('FormPagamentoModal', [conta], [conta]); }
export function abrirModalProductPerformance(performanceData, periodo) { openModal('ProductPerformanceModal', [performanceData, periodo], [performanceData, periodo]); }
export function abrirModalRegistarCompra(fornecedor, produtoPreSelecionado = null) { openModal('FormRegistarCompraModal', [fornecedor, produtoPreSelecionado], [fornecedor, produtoPreSelecionado]); }
export function abrirModalSeletorQuantidade(produtoNome, quantidadeAtual, onConfirm) { openModal('ModalSeletorQuantidade', [produtoNome, quantidadeAtual], [onConfirm]); }
export function abrirModalShortcutManagement(produto) { openModal('ShortcutManagementModal', [produto], [produto]); }
export function abrirModalTrocarCliente(conta, onConfirm) { openModal('ModalTrocarCliente', [conta], [conta, onConfirm]); }
export { init, closeSheet }; // Exporta init e a nova função closeSheet