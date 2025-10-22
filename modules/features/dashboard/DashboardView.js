// /modules/features/dashboard/DashboardView.js (CORRIGIDO: Bug #2 - Swiper WebComponent)
'use strict';

import store from '../../shared/services/Store.js';
import * as TipsService from '../../shared/services/TipsService.js';
import { abrirModalDicaDoDia, abrirModalEditBusinessName } from '../../shared/components/Modals.js';
import Router from '../../app/Router.js';
import { getTopSellingProductsToday } from '../inventario/services/ProductAnalyticsService.js';

let unsubscribe = null;
let viewNode = null;
let dashboardSwiperEl = null; // Alterado para guardar a referência ao ELEMENTO swiper

function updateDOM() {
    if (!viewNode) return;
    const state = store.getState();
    const { contasAtivas, inventario, config } = state;

    // Atualiza Header
    const profilePic = viewNode.querySelector('#header-profile-pic');
    if(profilePic) profilePic.src = config.profilePicDataUrl || 'icons/logo-small-192.png';
    const businessName = viewNode.querySelector('#header-business-name-display');
    if(businessName) businessName.textContent = config.businessName || 'O Meu Bar';

    // Atualiza Slide "Vendas de Hoje"
    const hojeString = new Date().toDateString();
    const contasFechadasHoje = contasAtivas.filter(c => c.status === 'fechada' && new Date(c.dataFecho).toDateString() === hojeString);
    const totaisVendas = contasFechadasHoje.reduce((acc, c) => {
        acc.total += c.valorFinal;
        if (c.metodoPagamento === 'Numerário') acc.numerario += c.valorFinal;
        else if (c.metodoPagamento === 'TPA') acc.tpa += c.valorFinal;
        return acc;
    }, { total: 0, numerario: 0, tpa: 0 });
    const vendasTotalEl = viewNode.querySelector('#db-vendas-total');
    if(vendasTotalEl) vendasTotalEl.textContent = totaisVendas.total.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    const vendasNumerarioEl = viewNode.querySelector('#db-vendas-numerario');
    if(vendasNumerarioEl) vendasNumerarioEl.textContent = totaisVendas.numerario.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    const vendasTpaEl = viewNode.querySelector('#db-vendas-tpa');
    if(vendasTpaEl) vendasTpaEl.textContent = totaisVendas.tpa.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

    // Atualiza Slide "Pulso do Atendimento"
    const contasRealmenteAtivas = contasAtivas.filter(c => c.status === 'ativa');
    const valorTotalEmAberto = contasRealmenteAtivas.reduce((sum, c) => sum + c.pedidos.reduce((sub, p) => sub + (p.preco * p.qtd), 0), 0);
    const pulsoValorAbertoEl = viewNode.querySelector('#pulso-valor-aberto');
    if(pulsoValorAbertoEl) pulsoValorAbertoEl.textContent = valorTotalEmAberto.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });
    const pulsoContasAtivasEl = viewNode.querySelector('#pulso-contas-ativas');
    if(pulsoContasAtivasEl) pulsoContasAtivasEl.textContent = `${contasRealmenteAtivas.length} Contas Ativas`;

    // Atualiza Slide "Alertas de Stock"
    const alertasStock = inventario.filter(item => item.stockLoja > 0 && item.stockLoja <= item.stockMinimo);
    const swiperWrapperAlertas = viewNode.querySelector('#swiper-alertas-container');
    if (swiperWrapperAlertas) {
        if (alertasStock.length === 0) {
            swiperWrapperAlertas.innerHTML = `<div class="empty-state-container small"><p>Nenhum alerta de stock na loja.</p></div>`;
        } else {
            swiperWrapperAlertas.innerHTML = alertasStock.map(item => `<div class="list-item alert-item" data-product-id="${item.id}"><span>${item.nome}</span> <span class="text-error">Restam: ${item.stockLoja}</span></div>`).join('');
        }
    }

    // Atualiza Card Fixo "Top Produtos"
    const produtosPopulares = getTopSellingProductsToday(state);
    const topProdutosContainer = viewNode.querySelector('#top-produtos-container');
    if (topProdutosContainer) {
        if (produtosPopulares.length === 0) {
            topProdutosContainer.innerHTML = `<div class="empty-state-container small"><p>Nenhuma venda registada hoje.</p></div>`;
        } else {
            topProdutosContainer.innerHTML = produtosPopulares.slice(0, 5).map(([nome, qtd], index) => `<div class="list-item"><span>${index + 1}. ${nome}</span> <span>${qtd} un.</span></div>`).join('');
        }
    }

    // Atualiza o Swiper se a instância já existir
    if (dashboardSwiperEl && dashboardSwiperEl.swiper) {
        dashboardSwiperEl.swiper.update();
    }
}

function render() {
    const state = store.getState();
    const businessName = state.config.businessName || 'O Meu Bar';
    const profilePicSrc = state.config.profilePicDataUrl || 'icons/logo-small-192.png';

    return `
        <header class="page-header">
            <div class="header-profile">
                <img id="header-profile-pic" src="${profilePicSrc}" alt="Logo" class="profile-pic">
                <input type="file" id="header-input-change-pic" class="hidden-input" accept="image/*">
                <span id="header-business-name-display" class="business-name">${businessName}</span>
            </div>
            <div class="header-actions">
                <button id="btn-header-dica" class="header-action-btn" aria-label="Dica do Dia"><i class="lni lni-bulb"></i></button>
                <button id="btn-settings" class="header-action-btn" aria-label="Configurações"><i class="lni lni-cog"></i></button>
            </div>
        </header>

        <main class="page-content">
         
            <swiper-container class="dashboard-swiper-container" init="false">
                <swiper-slide class="dashboard-slide">
                    <div class="card stat-card">
                        <div class="card-header">Vendas de Hoje</div>
                        <div class="card-body">
                            <span id="db-vendas-total" class="stat-primary"></span>
                            <div class="stat-secondary-group">
                                <span class="stat-secondary"><i class="lni lni-money-location"></i><b id="db-vendas-numerario"></b></span>
                                <span class="stat-secondary"><i class="lni lni-credit-cards"></i><b id="db-vendas-tpa"></b></span>
                            </div>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="dashboard-slide">
                    <div class="card stat-card">
                        <div class="card-header">Pulso do Atendimento</div>
                        <div class="card-body">
                            <span id="pulso-valor-aberto" class="stat-primary"></span>
                            <div class="stat-secondary-group vertical">
                                <span id="pulso-contas-ativas" class="stat-detail"></span>
                            </div>
                        </div>
                    </div>
                </swiper-slide>
                <swiper-slide class="dashboard-slide">
                     <div class="card">
                        <div class="card-header"><i class="lni lni-warning"></i> Alertas de Stock</div>
                        <div id="swiper-alertas-container" class="card-body-list"></div>
                    </div>
                </swiper-slide>
            </swiper-container>

            <div class="card">
                <div class="card-header"><i class="lni lni-trophy"></i> Top 5 Produtos do Dia</div>
                <div id="top-produtos-container" class="card-body-list"></div>
            </div>
        </main>
    `;
}

async function initializeDashboardSwiper() {
    dashboardSwiperEl = viewNode.querySelector('.dashboard-swiper-container');
    if (!dashboardSwiperEl) {
        console.error('[DashboardView] Elemento swiper-container não encontrado.');
        return;
    }
    
    // Define os parâmetros diretamente no elemento
    const params = {
        slidesPerView: 1,
        spaceBetween: 16,
        pagination: {
            clickable: true,
        },
    };
    Object.assign(dashboardSwiperEl, params);

    // Inicializa o Swiper
    try {
        await dashboardSwiperEl.initialize();
        console.log('[DashboardView] Swiper inicializado com sucesso.');
    } catch(error) {
        console.error('[DashboardView] Erro ao inicializar Swiper:', error);
    }
}


function mount() {
    viewNode = document.getElementById('app-root');
    viewNode.innerHTML = render();

    // *** CORREÇÃO: Chama a inicialização do Swiper após o render ***
    // Usamos um pequeno timeout para garantir que o DOM está pronto para o Swiper
    setTimeout(initializeDashboardSwiper, 0);
    
    // Listeners do Header (inalterados)
    const headerProfilePic = viewNode.querySelector('#header-profile-pic');
    const headerInputChangePic = viewNode.querySelector('#header-input-change-pic');
    headerProfilePic?.addEventListener('click', () => headerInputChangePic.click());
    headerInputChangePic?.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => store.dispatch({ type: 'UPDATE_CONFIG', payload: { profilePicDataUrl: e.target.result } });
            reader.readAsDataURL(file);
        }
    });
    viewNode.querySelector('#header-business-name-display')?.addEventListener('click', () => abrirModalEditBusinessName(store.getState().config.businessName || 'O Meu Bar'));
    viewNode.querySelector('#btn-settings')?.addEventListener('click', () => Router.navigateTo('#settings'));
    viewNode.querySelector('#btn-header-dica')?.addEventListener('click', async () => {
        const dica = await TipsService.getDailyTip();
        if (dica) abrirModalDicaDoDia(dica);
    });

    // Listener para os alertas de stock (inalterado)
    viewNode.querySelector('#swiper-alertas-container')?.addEventListener('click', (event) => {
        const alertItem = event.target.closest('.alert-item');
        if (alertItem && alertItem.dataset.productId) {
            Router.navigateTo(`#inventario/${alertItem.dataset.productId}`);
        }
    });

    // Subscrição e primeira chamada para popular os dados
    updateDOM();
    unsubscribe = store.subscribe(updateDOM);
}

function unmount() {
    if (unsubscribe) unsubscribe();
    // A destruição do Swiper é gerida automaticamente pelo web component ao ser removido do DOM
    unsubscribe = null;
    viewNode = null;
    dashboardSwiperEl = null;
}

export default { render, mount, unmount };