// /modules/features/financas/components/FormExportarComprasModal.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import { exportarRelatorioComprasPDF, exportarRelatorioComprasXLS } from '../services/ReportingService.js';

function toISODateString(date) {
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
}

export const render = () => {
    const hoje = new Date();
    const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    return `
<div id="modal-exportar-compras-overlay" class="modal-overlay">
    <form id="form-exportar-compras" class="modal-container">
        <header class="modal-header">
            <h3 class="modal-title">Exportar Histórico de Compras</h3>
            <button type="button" class="modal-close-button">&times;</button>
        </header>
        <div class="modal-body">
            <p class="form-help-text">Selecione o período para o qual deseja gerar o relatório.</p>
            <div class="form-grid-2-col">
                <div class="form-group">
                    <label for="input-data-inicio" class="form-label">Data de Início</label>
                    <input type="date" id="input-data-inicio" required class="input-field" value="${toISODateString(primeiroDiaDoMes)}">
                </div>
                <div class="form-group">
                    <label for="input-data-fim" class="form-label">Data de Fim</label>
                    <input type="date" id="input-data-fim" required class="input-field" value="${toISODateString(hoje)}">
                </div>
            </div>
        </div>
        <footer class="modal-footer footer-grid-2-col">
            <button type="button" id="btn-exportar-pdf" class="button button-error full-width">
                <i class="lni lni-download"></i> PDF
            </button>
            <button type="button" id="btn-exportar-xls" class="button button-success full-width">
                <i class="lni lni-download"></i> EXCEL
            </button>
        </footer>
    </form>
</div>`;
};

export const mount = (closeModal) => {
    const form = document.getElementById('form-exportar-compras');
    const dataInicioInput = form.querySelector('#input-data-inicio');
    const dataFimInput = form.querySelector('#input-data-fim');
    const btnPDF = form.querySelector('#btn-exportar-pdf');
    const btnXLS = form.querySelector('#btn-exportar-xls');

    const handleExport = (formato) => {
        const startDate = new Date(dataInicioInput.value);
        const endDate = new Date(dataFimInput.value);
        endDate.setHours(23, 59, 59, 999);

        if (!dataInicioInput.value || !dataFimInput.value || startDate > endDate) {
            return Toast.mostrarNotificacao("Por favor, selecione um período de datas válido.", "erro");
        }

        const state = store.getState();
        const comprasNoPeriodo = state.historicoCompras.filter(c => {
            const dataCompra = new Date(c.data);
            return dataCompra >= startDate && dataCompra <= endDate;
        });

        if (comprasNoPeriodo.length === 0) {
            return Toast.mostrarNotificacao("Não existem compras registadas no período selecionado.", "info");
        }

        if (formato === 'pdf') {
            exportarRelatorioComprasPDF(comprasNoPeriodo, state, startDate, endDate);
        } else if (formato === 'xls') {
            exportarRelatorioComprasXLS(comprasNoPeriodo, state, startDate, endDate);
        }

        closeModal();
    };

    btnPDF.addEventListener('click', () => handleExport('pdf'));
    btnXLS.addEventListener('click', () => handleExport('xls'));
    
    form.querySelector('.modal-close-button').addEventListener('click', closeModal);
    document.getElementById('modal-exportar-compras-overlay').addEventListener('click', e => {
        if (e.target.id === 'modal-exportar-compras-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};