// /modules/features/clientes/ClienteDetalhesView.js (ARQUITETURA REATORADA)
'use strict';

import store from '../../shared/services/Store.js';
import Router from '../../app/Router.js';
import { calculateClientProfile, getSpendingHistory } from './services/ClientAnalyticsService.js';
import { 
    abrirModalAddDivida, 
    abrirModalLiquidarDivida, 
    abrirModalEditCliente,
    abrirModalConfirmacao,
    abrirModalAcoesFlutuantes
} from '../../shared/components/Modals.js';
import * as Toast from '../../shared/components/Toast.js';
import { formatarMoeda, gerarIniciais, gerarAvatarDeIniciaisSVG } from '../../shared/lib/utils.js';

let unsubscribe = null;
let viewNode = null;
let activityChart = null;

function renderPreferences(produtosPreferidos) {
    if (!produtosPreferidos || produtosPreferidos.length === 0) {
        return `<p class="empty-list-message small">Nenhum produto consumido registado.</p>`;
    }
    const maxQtd = Math.max(...produtosPreferidos.map(p => p.qtd), 0);
    return produtosPreferidos.map(produto => `
        <div class="preference-item">
            <div>
                <p class="preference-info">${produto.nome}</p>
                <div class="preference-bar-container">
                    <div class="preference-bar" style="width: ${maxQtd > 0 ? (produto.qtd / maxQtd) * 100 : 0}%;"></div>
                </div>
            </div>
            <span class="preference-quantity">${produto.qtd} un.</span>
        </div>
    `).join('');
}


function render(clienteId) {
    const state = store.getState();
    const cliente = state.clientes.find(c => c.id === clienteId);
    if (!cliente) return `<div class="empty-state-container"><p>Cliente não encontrado.</p></div>`;

    const profile = calculateClientProfile(clienteId, state);
    const dividaTotal = cliente.dividas.reduce((total, d) => total + (d.tipo === 'debito' ? d.valor : -Math.abs(d.valor)), 0);

    let avatarSrc = './icons/logo-small-192.png';
    if (cliente.fotoDataUrl) {
        avatarSrc = cliente.fotoDataUrl;
    } else if (cliente.nome) {
        avatarSrc = gerarAvatarDeIniciaisSVG(gerarIniciais(cliente.nome));
    }

    return `
        <header class="page-header sticky-header">
            <button id="btn-voltar-clientes" class="header-action-btn back-btn"><i class="lni lni-arrow-left"></i></button>
            <h2 class="page-title">Perfil do Cliente</h2>
            <button id="btn-cliente-actions" class="header-action-btn"><i class="lni lni-more-alt"></i></button>
        </header>

        <main class="page-content">
            <div class="profile-summary-container">
                <div class="profile-avatar-wrapper">
                    <img src="${avatarSrc}" alt="Foto de ${cliente.nome}" class="avatar large">
                    <div class="avatar-upload-trigger"><i class="lni lni-camera"></i></div>
                    <input type="file" id="input-foto-cliente" class="hidden-input" accept="image/*">
                </div>
                <h3 class="profile-name">${cliente.nome}</h3>
                <p class="profile-contact">${cliente.contacto || 'Sem contacto'}</p>
            </div>
            
            <div class="stats-grid card">
                 <div class="stat-item"><span class="stat-value">${profile.visitas}</span><span class="stat-label">Visitas</span></div>
                <div class="stat-item"><span class="stat-value">${formatarMoeda(profile.gastoTotal)}</span><span class="stat-label">Gasto Total</span></div>
                <div class="stat-item"><span class="stat-value">${formatarMoeda(profile.ticketMedio)}</span><span class="stat-label">Ticket Médio</span></div>
                <div class="stat-item"><span class="stat-value">${profile.dataUltimaVisita ? profile.dataUltimaVisita.toLocaleDateString('pt-PT') : 'N/A'}</span><span class="stat-label">Última Visita</span></div>
            </div>

            <div class="current-balance-card ${dividaTotal > 0 ? 'has-debt' : 'no-debt'}">
                <span class="balance-label">Conta Corrente</span>
                <span class="balance-value">${formatarMoeda(dividaTotal)}</span>
                <div class="action-buttons split-button">
                    <button id="btn-liquidar-divida" class="button split-button-main" ${dividaTotal <= 0 ? 'disabled' : ''}>Pagar Dívida</button>
                    <button id="btn-add-divida" class="button split-button-trigger">+</button>
                </div>
            </div>

            <div class="card">
                <details class="accordion-item">
                    <summary class="accordion-header" style="padding: 16px;"><h4 class="accordion-title">Atividade (Últimos 6 Meses)</h4><i class="accordion-icon lni lni-chevron-down"></i></summary>
                    <div class="accordion-content"><div class="chart-container"><canvas id="activity-chart"></canvas></div></div>
                </details>
            </div>
            
            <div class="card">
                <details class="accordion-item">
                    <summary class="accordion-header" style="padding: 16px;"><h4 class="accordion-title">Top Produtos Consumidos</h4><i class="accordion-icon lni lni-chevron-down"></i></summary>
                    <div class="accordion-content"><div class="preferences-list">${renderPreferences(profile.produtosPreferidos)}</div></div>
                </details>
            </div>
        </main>
    `;
}

function mount(clienteId) {
    viewNode = document.getElementById('app-root');
    const update = () => {
        if (!viewNode) return;
        const state = store.getState();
        const cliente = state.clientes.find(c => c.id === clienteId);
        if (!cliente) { Router.navigateTo('#clientes'); return; }
        
        const scrollPosition = viewNode.scrollTop;
        viewNode.innerHTML = render(clienteId);
        viewNode.scrollTop = scrollPosition;
        renderActivityChart(clienteId);
    };

    const handleViewClick = (e) => {
        const state = store.getState();
        const cliente = state.clientes.find(c => c.id === clienteId);
        if (!cliente) return;

        if (e.target.closest('.profile-avatar-wrapper')) { viewNode.querySelector('#input-foto-cliente').click(); return; }
        if (e.target.closest('#btn-voltar-clientes')) { Router.navigateTo('#clientes'); return; }
        if (e.target.closest('#btn-add-divida')) { abrirModalAddDivida(cliente); return; }
        if (e.target.closest('#btn-liquidar-divida')) { if (cliente.dividas.reduce((t, d) => t + (d.tipo === 'debito' ? d.valor : -d.valor), 0) > 0) abrirModalLiquidarDivida(cliente); return; }
        if (e.target.closest('#btn-cliente-actions')) {
            abrirModalAcoesFlutuantes(`Ações para ${cliente.nome}`, [
                { acao: 'exportar', texto: 'Exportar Extrato de Conta', icone: 'lni-download', callback: () => Toast.mostrarNotificacao("Funcionalidade em desenvolvimento.") },
                { acao: 'editar', texto: 'Editar Dados', icone: 'lni-pencil', callback: () => abrirModalEditCliente(cliente) },
                { acao: 'apagar', texto: 'Apagar Cliente', icone: 'lni-trash-can', cor: 'var(--feedback-error)', callback: () => {
                    abrirModalConfirmacao(`Apagar ${cliente.nome}?`, 'Esta ação é irreversível.', () => {
                        store.dispatch({ type: 'DELETE_CLIENT', payload: cliente.id });
                        Toast.mostrarNotificacao(`Cliente ${cliente.nome} apagado.`);
                        Router.navigateTo('#clientes');
                    });
                }}
            ]);
            return;
        }
    };
    
    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            store.dispatch({ type: 'UPDATE_CLIENT', payload: { id: clienteId, fotoDataUrl: event.target.result } });
            Toast.mostrarNotificacao("Foto do cliente atualizada.");
        };
        reader.readAsDataURL(file);
    };

    update();
    viewNode.addEventListener('click', handleViewClick);
    viewNode.querySelector('#input-foto-cliente')?.addEventListener('change', handlePhotoUpload);
    unsubscribe = store.subscribe(update);
}

function renderActivityChart(clienteId) {
    if (activityChart) activityChart.destroy();
    const ctx = viewNode.querySelector('#activity-chart')?.getContext('2d');
    if (!ctx) return;

    const historyData = getSpendingHistory(clienteId, store.getState());
    
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-decorative').trim();
    const fontColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
    const barColor = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim();

    activityChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: historyData.labels, datasets: [{ data: historyData.data, backgroundColor: `${barColor}B3`, borderColor: barColor, borderWidth: 2, borderRadius: 4 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `Gasto: ${formatarMoeda(c.raw)}` }}},
            scales: {
                y: { beginAtZero: true, ticks: { display: false }, grid: { color: gridColor, drawBorder: false }},
                x: { ticks: { color: fontColor }, grid: { display: false }}
            }
        }
    });
}


function unmount() {
    if (unsubscribe) unsubscribe();
    if (activityChart) { activityChart.destroy(); activityChart = null; }
    // A remoção dos event listeners é gerida pela refatoração do mount para evitar duplicados
    unsubscribe = null;
    viewNode = null;
}

export default { render, mount, unmount };