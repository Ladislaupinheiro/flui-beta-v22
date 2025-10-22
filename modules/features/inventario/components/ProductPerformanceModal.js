// /modules/features/inventario/components/ProductPerformanceModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

const formatCurrency = (value) => (value || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

function renderListContent(data, type) {
    if (!data || data.length === 0) {
        return '<p class="empty-list-message">Nenhum dado disponível para este período.</p>';
    }

    return data.map((item, index) => {
        let valueHTML = '';
        switch (type) {
            case 'sellers':
                valueHTML = `<strong>${item.qtd}</strong> un.`;
                break;
            case 'profit':
                valueHTML = `<strong class="text-success">${formatCurrency(item.lucro)}</strong>`;
                break;
            case 'zombies':
                const dateStr = item.ultimaVenda 
                    ? `Últ. venda: ${new Date(item.ultimaVenda).toLocaleDateString('pt-PT')}`
                    : 'Nunca vendido';
                valueHTML = `<span class="text-secondary text-sm">${dateStr}</span>`;
                break;
        }

        return `
            <div class="performance-list-item">
                <span class="item-name">${index + 1}. ${item.nome}</span>
                <span class="item-value">${valueHTML}</span>
            </div>
        `;
    }).join('');
}

export const render = (performanceData, periodo) => {
    const initialListHTML = renderListContent(performanceData.topSellers, 'sellers');

    return `
    <div id="modal-product-performance-overlay" class="modal-overlay">
        <div class="modal-container">
            <header class="modal-header">
                <div>
                    <h3 class="modal-title">Relatório de Produtos</h3>
                    <p class="modal-subtitle">${periodo}</p>
                </div>
                <button type="button" class="modal-close-button">&times;</button>
            </header>
            
            <nav id="modal-tabs-nav" class="tab-nav modal-tabs">
                <button class="tab-button active" data-tab="sellers">Top Vendas</button>
                <button class="tab-button" data-tab="profit">Mais Rentáveis</button>
                <button class="tab-button" data-tab="zombies">Estagnados</button>
            </nav>

            <div id="modal-list-container" class="modal-body with-padding">
                ${initialListHTML}
            </div>

            <footer class="modal-footer">
                <button class="button-text btn-fechar-modal-footer">Fechar</button>
            </footer>
        </div>
    </div>`;
};

export const mount = (closeModal, performanceData, periodo) => {
    const overlay = document.getElementById('modal-product-performance-overlay');
    const listContainer = overlay.querySelector('#modal-list-container');
    const tabsContainer = overlay.querySelector('#modal-tabs-nav');

    tabsContainer.addEventListener('click', (e) => {
        const target = e.target.closest('.tab-button');
        if (!target) return;

        tabsContainer.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');

        const tabType = target.dataset.tab;
        let dataToShow;

        switch (tabType) {
            case 'sellers': dataToShow = performanceData.topSellers; break;
            case 'profit': dataToShow = performanceData.topProfit; break;
            case 'zombies': dataToShow = performanceData.zombieProducts; break;
        }

        listContainer.innerHTML = renderListContent(dataToShow, tabType);
    });
    
    overlay.querySelector('.modal-close-button')?.addEventListener('click', closeModal);
    overlay.querySelector('.btn-fechar-modal-footer')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => {
        if (e.target.id === 'modal-product-performance-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};