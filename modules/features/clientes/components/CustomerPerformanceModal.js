// /modules/features/clientes/components/CustomerPerformanceModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

const formatCurrency = (value) => (value || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

export const render = (customerInsights, periodo) => {
    const topSpendersHTML = customerInsights.topSpenders && customerInsights.topSpenders.length > 0
        ? customerInsights.topSpenders.map((cliente, index) => `
            <div class="performance-list-item">
                <div class="item-info">
                    <span class="item-rank">${index + 1}.</span>
                    <div>
                        <p class="item-name">${cliente.nome}</p>
                        <p class="item-subtitle">${cliente.visitas} visita(s) no período</p>
                    </div>
                </div>
                <span class="item-value text-success">${formatCurrency(cliente.gastoTotal)}</span>
            </div>
        `).join('')
        : '<p class="empty-list-message">Nenhum gasto de cliente registado neste período.</p>';

    return `
    <div id="modal-customer-performance-overlay" class="modal-overlay">
        <div class="modal-container">
            <header class="modal-header">
                <div>
                    <h3 class="modal-title">Ranking de Clientes</h3>
                    <p class="modal-subtitle">${periodo}</p>
                </div>
                <button type="button" class="modal-close-button">&times;</button>
            </header>
            
            <div class="modal-body with-padding">
                ${topSpendersHTML}
            </div>

            <footer class="modal-footer">
                <button class="button-text btn-fechar-modal-footer">Fechar</button>
            </footer>
        </div>
    </div>`;
};

export const mount = (closeModal) => {
    const overlay = document.getElementById('modal-customer-performance-overlay');
    
    overlay.querySelector('.modal-close-button')?.addEventListener('click', closeModal);
    overlay.querySelector('.btn-fechar-modal-footer')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', e => {
        if (e.target.id === 'modal-customer-performance-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};