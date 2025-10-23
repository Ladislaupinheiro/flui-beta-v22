// /service-worker.js (COMPLETO E ATUALIZADO - v6)
'use strict';

const CACHE_NAME = 'flui-v6'; // Versão incrementada

const URLS_TO_CACHE = [
    // --- Core & Assets ---
    './',
    './index.html',
    './manifest.json',
    './tips.json',
    './produtos-padrao-ao.json',
    './favicon.png',
    './icons/logo-small-192.png',
    './icons/logo-big-512.png',

    // --- Styles ---
    './styles/main.css',
    './styles/core/tokens.css',
    './styles/core/base.css',
    './styles/components/accordion.css',
    './styles/components/avatar.css',
    './styles/components/badge.css',
    './styles/components/button.css',
    './styles/components/calendar.css',
    './styles/components/card.css',
    './styles/components/chip.css',
    './styles/components/fab.css',
    './styles/components/form.css',
    './styles/components/modal.css',
    './styles/components/nav-bar.css',
    './styles/components/tab-nav.css',
    './styles/components/toast.css',
    './styles/components/toggle-switch.css',
    './styles/components/wizard.css',
    './styles/components/snackbar.css', // <-- NOVO: Snackbar CSS
    './styles/views/analises.css',
    './styles/views/cliente-detalhes.css',
    './styles/views/client-list.css',
    './styles/views/conta-detalhes.css',
    './styles/views/dashboard.css',
    './styles/views/fluxo-caixa.css',
    './styles/views/fornecedor-detalhes.css',
    './styles/views/inventario.css',
    './styles/views/page-layouts.css',
    './styles/views/relatorios.css',
    './styles/views/settings.css',

    // --- App Core ---
    './modules/app/app.js',
    './modules/app/Router.js',

    // --- Shared Modules ---
    './modules/shared/components/Modals.js',
    './modules/shared/components/Nav.js',
    './modules/shared/components/Toast.js',
    './modules/shared/components/SnackbarComponent.js', // <-- NOVO
    './modules/shared/lib/utils.js',
    './modules/shared/services/Storage.js',
    './modules/shared/services/Store.js',
    './modules/shared/services/ThemeService.js',
    './modules/shared/services/TipsService.js',
    './modules/shared/services/CatalogoService.js',
    './modules/shared/services/PWAService.js', // <-- NOVO
    './modules/shared/services/SnackbarService.js', // <-- NOVO
    './modules/shared/ui/ConfirmacaoModal.js',
    './modules/shared/ui/PackagingSlider.js', // <-- NOVO

    // --- Shared Store Slices ---
    './modules/shared/store/combineReducers.js',
    './modules/shared/store/inventarioSlice.js',
    './modules/shared/store/clientesSlice.js',
    './modules/shared/store/tagsDeClienteSlice.js',
    './modules/shared/store/atendimentoSlice.js',
    './modules/shared/store/despesasSlice.js',
    './modules/shared/store/historicoFechosSlice.js',
    './modules/shared/store/configSlice.js',
    './modules/shared/store/fornecedoresSlice.js',
    './modules/shared/store/historicoComprasSlice.js',
    './modules/shared/store/categoriasDeProdutoSlice.js',

    // --- Features: Modals & Steps (NOVOS FLUXOS) ---
    './modules/features/atendimento/components/FormAddPedidoModal.js',
    './modules/features/atendimento/components/FormNovaContaModal.js',
    './modules/features/atendimento/components/FormPagamentoModal.js',
    './modules/features/atendimento/components/ModalAcoesFlutuantes.js',
    './modules/features/atendimento/components/ModalAcoesPedido.js',
    './modules/features/atendimento/components/ModalSeletorQuantidade.js',
    './modules/features/atendimento/components/ModalTrocarCliente.js',
    './modules/features/clientes/components/CustomerPerformanceModal.js',
    './modules/features/clientes/components/FormAddClienteModal.js',
    './modules/features/clientes/components/FormAddDividaModal.js',
    './modules/features/clientes/components/FormEditClienteModal.js',
    './modules/features/clientes/components/FormLiquidarDividaModal.js',
    './modules/features/dashboard/components/DicaDoDiaModal.js',
    './modules/features/dashboard/components/FormEditBusinessNameModal.js',
    './modules/features/financas/components/FechoGlobalModal.js',
    './modules/features/financas/components/FormExportarComprasModal.js',
    './modules/features/financas/components/FormNovaDespesaModal.js',
    './modules/features/inventario/components/FormAddFornecedorModal.js',
    './modules/features/inventario/components/FormAddProdutoModal.js',
    './modules/features/inventario/components/FormAddStockModal.js',
    './modules/features/inventario/components/FormAddSubcategoriaModal.js',
    './modules/features/inventario/components/FormEditFornecedorModal.js',
    './modules/features/inventario/components/FormEditProdutoModal.js',
    './modules/features/inventario/components/FormGerirCategoriasModal.js',
    './modules/features/inventario/components/FormMoverStockModal.js',
    './modules/features/inventario/components/FormRegistarCompraModal.js', // Orquestrador atualizado
    './modules/features/inventario/components/Step1_ProductSelection.js', // <-- NOVO PASSO 1
    './modules/features/inventario/components/Step2_ItemDetails.js',     // <-- NOVO PASSO 2
    './modules/features/inventario/components/Step3_PurchaseFinalization.js', // <-- NOVO PASSO 3
    './modules/features/inventario/components/ProductPerformanceModal.js',
    './modules/features/inventario/components/ShortcutManagementModal.js',
    './modules/features/inventario/components/ModalFiltroSubcategoria.js',
    './modules/features/inventario/components/FornecedoresList.js',
    './modules/features/inventario/components/ProdutosGrid.js',
    './modules/features/inventario/components/SupplierProfile.js',
    './modules/features/inventario/components/SupplierAnalytics.js',
    './modules/features/inventario/components/PurchaseHistory.js',
    './modules/features/settings/components/BackupRestoreModal.js',

    // --- Views Modulares (NOVAS) ---
    './modules/features/financas/components/HojeSubView.js',
    './modules/features/financas/components/HistoricoSubView.js',
    './modules/features/financas/components/DespesasSubView.js',

    // --- Features: Services ---
    './modules/features/clientes/services/ClientAnalyticsService.js',
    './modules/features/financas/services/CashFlowService.js',
    './modules/features/financas/services/FinancialReportingService.js',
    './modules/features/financas/services/ReportingService.js',
    './modules/features/inventario/services/ProductAnalyticsService.js',
    './modules/features/inventario/services/SupplierAnalyticsService.js',

    // --- Features: Views ---
    './modules/features/analises/AnálisesView.js',
    './modules/features/atendimento/AtendimentoView.js',
    './modules/features/atendimento/ContaDetalhesView.js',
    './modules/features/clientes/ClienteDetalhesView.js',
    './modules/features/clientes/ClientesView.js',
    './modules/features/dashboard/DashboardView.js',
    './modules/features/financas/FluxoCaixaView.js',
    './modules/features/inventario/FornecedorDetalhesView.js',
    './modules/features/inventario/InventarioView.js',
    './modules/features/settings/SettingsView.js',
    './modules/features/settings/BusinessInfoView.js',
    './modules/features/settings/CatalogoGlobalView.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            try {
                await cache.addAll(URLS_TO_CACHE);
            } catch (error) {
                console.warn('[SW] Falha no addAll, tentando individualmente:', error);
                for (const url of URLS_TO_CACHE) {
                    try {
                        await cache.add(url);
                    } catch (err) {
                        console.warn(`[SW] Falha ao guardar em cache: ${url}`);
                    }
                }
            }
        }).then(() => {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            });
        })
    );
});