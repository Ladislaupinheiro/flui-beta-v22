// /modules/features/inventario/components/FormRegistarCompraModal.js (ORQUESTRADOR FINAL)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';

// Importa os novos componentes-filho
import Step1_AddItem from './Step1_AddItem.js';
import Step2_ReviewPurchase from './Step2_ReviewPurchase.js';
import Step3_SetPrices from './Step3_SetPrices.js';

let wizardState = {
    currentStep: 1,
    fornecedor: null,
    produtoPreSelecionado: null,
    itensCompra: [],
    metodoPagamento: 'Numerário',
    precosVenda: {}
};

let activeChild = null;

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
    if (wizardState.currentStep === 1) {
        return `
            <button type="button" data-action="cancel" class="button button-secondary">Cancelar</button>
            <button type="button" data-action="next" class="button button-primary" ${wizardState.itensCompra.length === 0 ? 'disabled' : ''}>Avançar</button>`;
    } else if (wizardState.currentStep === 2) {
        return `
            <button type="button" data-action="prev" class="button button-secondary">Voltar</button>
            <button type="button" data-action="submit" class="button button-success">Registar Compra</button>`;
    } else if (wizardState.currentStep === 3) {
        return `
            <button type="button" data-action="finish" class="button button-primary full-width">Concluir e Fechar</button>`;
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

    const onStateChange = (newState) => {
        wizardState = { ...wizardState, ...newState };
        const footerEl = document.querySelector('#wizard-footer');
        if (footerEl) {
            footerEl.innerHTML = renderFooter();
        }
    };

    switch (wizardState.currentStep) {
        case 1:
            activeChild = Step1_AddItem;
            await Step1_AddItem.mount(container, wizardState, onStateChange);
            break;
        case 2:
            activeChild = Step2_ReviewPurchase;
            await Step2_ReviewPurchase.mount(container, wizardState, onStateChange);
            break;
        case 3:
            activeChild = Step3_SetPrices;
            await Step3_SetPrices.mount(container, wizardState, onStateChange);
            break;
    }
}

function registarCompra() {
    if (wizardState.itensCompra.length === 0) {
        Toast.mostrarNotificacao("Adicione pelo menos um item à compra.", "erro");
        return;
    }

    wizardState.itensCompra.forEach(item => {
        store.dispatch({
            type: 'ADD_COMPRA',
            payload: {
                fornecedorId: wizardState.fornecedor?.id || null,
                produtoId: item.produtoId,
                quantidade: item.quantidadeTotal,
                custoTotal: item.custoTotalItem,
                metodoPagamento: wizardState.metodoPagamento,
                unidadesPorEmbalagem: item.unidadesPorEmbalagem,
                numeroEmbalagens: item.embalagens
            }
        });
    });

    wizardState.precosVenda = wizardState.itensCompra.reduce((acc, item) => {
        const produtoNoStore = store.getState().inventario.find(p => p.id === item.produtoId);
        acc[item.produtoId] = produtoNoStore?.precoVenda || '';
        return acc;
    }, {});

    wizardState.currentStep = 3;
}

function concluirEFechar(closeModal) {
    let precosValidos = true;
    Object.entries(wizardState.precosVenda).forEach(([produtoId, preco]) => {
        if (preco === '' || isNaN(parseFloat(preco)) || parseFloat(preco) < 0) {
            precosValidos = false;
        } else {
            store.dispatch({
                type: 'SET_SELLING_PRICE',
                payload: { produtoId, precoVenda: parseFloat(preco) }
            });
        }
    });

    if (!precosValidos) {
        Toast.mostrarNotificacao("Defina um preço de venda válido (>= 0) para todos os itens.", "erro");
        return;
    }

    Toast.mostrarNotificacao("Compra registada e preços definidos com sucesso!");
    closeModal();
}

export const render = (fornecedorPreSelecionado = null, produtoPreSelecionado = null) => {
    wizardState = {
        currentStep: 1,
        fornecedor: fornecedorPreSelecionado,
        produtoPreSelecionado: produtoPreSelecionado,
        itensCompra: [],
        metodoPagamento: 'Numerário',
        precosVenda: {}
    };

    const fornecedorNome = wizardState.fornecedor ? wizardState.fornecedor.nome : 'Geral';
    const stepTitles = ["Adicionar Itens", "Revisão e Pagamento", "Definir Preços (Finalizar)"];

    return `
<div id="modal-registar-compra-overlay" class="modal-overlay">
    <form id="form-registar-compra" class="modal-container wizard-container">
        <header class="modal-header wizard-header">
            <div>
                <h3 id="wizard-title" class="modal-title">Registar Compra (${fornecedorNome})</h3>
                <p class="modal-subtitle">Passo ${wizardState.currentStep} de 3: ${stepTitles[wizardState.currentStep - 1]}</p>
            </div>
            <div class="progress-bar-container">
                 <div class="progress-bar">${renderIndicator()}</div>
            </div>
            <button type="button" class="modal-close-button">&times;</button>
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

export const mount = async (closeModal, fornecedorPreSelecionado = null, produtoPreSelecionado = null) => {
    const overlay = document.getElementById('modal-registar-compra-overlay');

    const renderWizardUI = () => {
        const titleEl = overlay.querySelector('#wizard-title');
        const subtitleEl = overlay.querySelector('.modal-subtitle');
        const progressBarEl = overlay.querySelector('.progress-bar');
        const stepsContainerEl = overlay.querySelector('#wizard-steps-container');
        const footerEl = overlay.querySelector('#wizard-footer');

        const fornecedorNome = wizardState.fornecedor ? wizardState.fornecedor.nome : 'Geral';
        const stepTitles = ["Adicionar Itens", "Revisão e Pagamento", "Definir Preços (Finalizar)"];

        if (titleEl) titleEl.textContent = `Registar Compra (${fornecedorNome})`;
        if (subtitleEl) subtitleEl.textContent = `Passo ${wizardState.currentStep} de 3: ${stepTitles[wizardState.currentStep - 1]}`;
        if (progressBarEl) progressBarEl.innerHTML = renderIndicator();
        if (footerEl) footerEl.innerHTML = renderFooter();

        if (!stepsContainerEl.querySelector(`#step-${wizardState.currentStep}-container`)) {
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
                wizardState.currentStep++;
                renderWizardUI();
                break;
            case 'prev':
                wizardState.currentStep--;
                renderWizardUI();
                break;
            case 'submit':
                registarCompra();
                renderWizardUI();
                break;
            case 'finish':
                concluirEFechar(closeModal);
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
        currentStep: 1, fornecedor: null, produtoPreSelecionado: null,
        itensCompra: [], metodoPagamento: 'Numerário', precosVenda: {}
    };
};