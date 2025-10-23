// /modules/features/inventario/components/FormRegistarCompraModal.js (ORQUESTRADOR FINAL - NOVO FLUXO)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

// Importa os novos componentes modulares
import Step1_ProductSelection from './Step1_ProductSelection.js';
import Step2_ItemDetails from './Step2_ItemDetails.js';
import Step3_PurchaseFinalization from './Step3_PurchaseFinalization.js';

let wizardState = {
    currentStep: 1,
    fornecedor: null,
    selectedCatalogItems: [], 
    detailedPurchaseItems: [], 
    metodoPagamento: 'Numerário',
    custoTotalCompraGeral: 0,
};

let activeChild = null;

const stepComponents = {
    1: Step1_ProductSelection,
    2: Step2_ItemDetails,
    3: Step3_PurchaseFinalization,
};

function renderIndicator() {
    const steps = [1, 2, 3];
    return steps.map(step =>
        `<div class="progress-bar-step ${wizardState.currentStep >= step ? 'active' : ''}"></div>`
    ).join('');
}

function renderStepContainer() {
    return `<div id="step-${wizardState.currentStep}-container" class="wizard-step-content"></div>`;
}

function renderFooter() {
    const isStep2Complete = wizardState.detailedPurchaseItems.every(item => item.quantidadeTotal > 0 && item.custoTotalItem > 0 && item.precoVenda > 0);

    if (wizardState.currentStep === 1) {
        return `
            <button type="button" data-action="cancel" class="button button-secondary">Cancelar</button>
            <button type="button" data-action="next" class="button button-primary" ${wizardState.selectedCatalogItems.length === 0 ? 'disabled' : ''}>Avançar</button>`;
    } else if (wizardState.currentStep === 2) {
        return `
            <button type="button" data-action="prev" class="button button-secondary">Voltar</button>
            <button type="button" data-action="next" class="button button-primary" ${!isStep2Complete ? 'disabled' : ''}>Avançar</button>`;
    } else if (wizardState.currentStep === 3) {
         return `
            <button type="button" data-action="prev" class="button button-secondary">Voltar</button>
            <button type="button" data-action="finish" class="button button-success">Finalizar Compra</button>`;
    }
    return '';
}

function unmountChild() {
    if (activeChild && typeof activeChild.unmount === 'function') {
        activeChild.unmount();
    }
    activeChild = null;
}

async function mountChild() {
    unmountChild();
    const container = document.querySelector(`#step-${wizardState.currentStep}-container`);
    if (!container) return;

    const Component = stepComponents[wizardState.currentStep];
    if (!Component) {
         container.innerHTML = `<p class="empty-list-message">Erro: Componente do Passo ${wizardState.currentStep} não encontrado.</p>`;
         return;
    }
    
    const onStateChange = (newState) => {
        wizardState = { ...wizardState, ...newState };
        const footerEl = document.querySelector('#wizard-footer');
        if (footerEl) {
            footerEl.innerHTML = renderFooter();
        }
        // Se a mudança for no Passo 3 (método de pagamento), re-renderizamos apenas o Passo 3
        if (wizardState.currentStep === 3) {
            mountChild();
        }
    };

    activeChild = Component;
    await Component.mount(container, wizardState, onStateChange);
}

function handleFinalizePurchase(closeModal) {
    if (wizardState.custoTotalCompraGeral <= 0) {
        Toast.mostrarNotificacao("O custo total da compra deve ser superior a 0 Kz.", "erro");
        return;
    }
    
    // 1. Disparar ações para Custo/Stock e Preço de Venda
    wizardState.detailedPurchaseItems.forEach(item => {
        store.dispatch({
            type: 'ADD_COMPRA',
            payload: {
                fornecedorId: wizardState.fornecedor?.id || null,
                produtoId: item.id,
                quantidade: item.quantidadeTotal,
                custoTotal: item.custoTotalItem,
                metodoPagamento: wizardState.metodoPagamento,
                unidadesPorEmbalagem: item.unidadesPorEmbalagem,
                numeroEmbalagens: item.embalagens
            }
        });

        // 2. Disparar ações para Preço de Venda
        if (item.precoVenda !== null && item.precoVenda > 0) {
            store.dispatch({
                type: 'SET_SELLING_PRICE',
                payload: { produtoId: item.id, precoVenda: item.precoVenda }
            });
        }
    });

    Toast.mostrarNotificacao("Compra registada e inventário atualizado com sucesso!", "success");
    closeModal();
}


export const render = (fornecedorPreSelecionado = null) => {
    wizardState = {
        currentStep: 1,
        fornecedor: fornecedorPreSelecionado,
        selectedCatalogItems: [], 
        detailedPurchaseItems: [],
        metodoPagamento: 'Numerário',
        custoTotalCompraGeral: 0,
    };

    const fornecedorNome = wizardState.fornecedor ? wizardState.fornecedor.nome : 'Registo Geral';
    const stepTitles = ["Seleção de Produtos", "Detalhes (Qtd./Custo/Preço)", "Finalização da Compra"];

    return `
<div id="modal-registar-compra-overlay" class="modal-overlay">
    <div id="wizard-progression-bar" style="position: fixed; top: 0; width: 100%; display: flex; justify-content: center; padding-top: var(--space-4); z-index: 110;">
        <div class="progress-bar" style="width: 150px;">${renderIndicator()}</div>
    </div>
    
    <form id="form-registar-compra" class="modal-container wizard-container">
        <header class="modal-header wizard-header" style="border-bottom: 1px solid var(--border-decorative);">
            <button type="button" class="modal-close-button">&times;</button>
            <div style="flex-grow: 1; text-align: center;">
                <h3 class="modal-title">Registar Compra</h3>
                <p class="modal-subtitle">Passo ${wizardState.currentStep} de 3: ${stepTitles[wizardState.currentStep - 1]}</p>
            </div>
            <div style="width: 28px;"></div>
        </header>

        <div id="wizard-steps-container" class="modal-body">
            ${renderStepContainer()}
        </div>

        <footer id="wizard-footer" class="modal-footer wizard-footer">
            ${renderFooter()}
        </footer>
    </form>
</div>`;
};

export const mount = async (closeModal, fornecedorPreSelecionado = null) => {
    const overlay = document.getElementById('modal-registar-compra-overlay');

    const renderWizardUI = () => {
        const progressionBar = overlay.querySelector('#wizard-progression-bar .progress-bar');
        const headerTitleContainer = overlay.querySelector('.modal-header div:nth-child(2)');
        const footerEl = overlay.querySelector('#wizard-footer');

        const stepTitles = ["Seleção de Produtos", "Detalhes (Qtd./Custo/Preço)", "Finalização da Compra"];

        if (progressionBar) progressionBar.innerHTML = renderIndicator();
        if (headerTitleContainer) {
            headerTitleContainer.querySelector('.modal-subtitle').textContent = `Passo ${wizardState.currentStep} de 3: ${stepTitles[wizardState.currentStep - 1]}`;
        }
        if (footerEl) footerEl.innerHTML = renderFooter();

        const stepsContainerEl = overlay.querySelector('#wizard-steps-container');
        if (stepsContainerEl.querySelector(`#step-${wizardState.currentStep}-container`) === null) {
            stepsContainerEl.innerHTML = renderStepContainer();
        }
        mountChild();
    };

    const handleFooterClick = (e) => {
        const actionBtn = e.target.closest('[data-action]');
        if (!actionBtn) return;
        const action = actionBtn.dataset.action;

        switch (action) {
            case 'next':
                // Regra de transição do Passo 1: Transferir itens selecionados para DetailedItems
                if (wizardState.currentStep === 1) {
                    if (wizardState.selectedCatalogItems.length === 0) return;
                    
                    // Inicializa os itens detalhados do Passo 2 com base na seleção do Passo 1
                    wizardState.detailedPurchaseItems = wizardState.selectedCatalogItems.map(item => ({
                        id: item.id,
                        nome: item.nome,
                        tags: item.tags,
                        embalagens: 1,
                        unidadesPorEmbalagem: 12, // Default inicial
                        custoTotalItem: 0,
                        precoVenda: null,
                        quantidadeTotal: 12 // Default inicial
                    }));
                }
                wizardState.currentStep++;
                renderWizardUI();
                break;
            case 'prev':
                wizardState.currentStep--;
                // Regra de transição do Passo 2: Transferir DetailedItems de volta para SelectedItems
                if (wizardState.currentStep === 1) {
                    wizardState.selectedCatalogItems = wizardState.detailedPurchaseItems.map(item => ({
                        id: item.id,
                        nome: item.nome,
                        tags: item.tags
                    }));
                }
                renderWizardUI();
                break;
            case 'finish':
                handleFinalizePurchase(closeModal);
                break;
            case 'cancel':
                closeModal();
                break;
        }
    };

    overlay.querySelector('.modal-close-button')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => {
        if (e.target.id === 'modal-registar-compra-overlay') closeModal();
    });
    overlay.querySelector('#wizard-footer')?.addEventListener('click', handleFooterClick);
    
    mountChild();
};

export const unmount = () => {
    unmountChild();
    wizardState = {
        currentStep: 1, fornecedor: null, selectedCatalogItems: [], detailedPurchaseItems: [],
        metodoPagamento: 'Numerário', custoTotalCompraGeral: 0,
    };
};