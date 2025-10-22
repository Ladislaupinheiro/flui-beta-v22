// /modules/features/financas/components/FechoGlobalModal.js (FINALIZADO COM WEB SHARE API)
'use strict';

import store from '../../../shared/services/Store.js';
import * as Toast from '../../../shared/components/Toast.js';
import { abrirModalConfirmacao } from '../../../shared/components/Modals.js';
import { gerarRelatorioPDFBlob, exportarRelatorioPDF } from '../services/ReportingService.js'; // Importa ambas as funções
import { formatarMoeda } from '../../../shared/lib/utils.js';
import PWAService from '../../../shared/services/PWAService.js';

export const render = (relatorio) => {
    const dataFormatada = new Date(relatorio.data).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const produtosVendidosHTML = Object.entries(relatorio.produtosVendidos)
        .sort(([, a], [, b]) => b - a)
        .map(([nome, qtd]) => `<div class="list-item-condensed"><span>${qtd}x</span><span>${nome}</span></div>`)
        .join('') || '<p class="empty-list-message small">Nenhum produto vendido.</p>';

    const despesasHTML = relatorio.despesasDoDia.length > 0 ? relatorio.despesasDoDia
        .map(despesa => `
            <div class="list-item-condensed">
                <span>${despesa.descricao}</span>
                <span class="text-error font-bold">- ${formatarMoeda(despesa.valor)}</span>
            </div>
        `).join('') : '<p class="empty-list-message small">Nenhuma despesa registada.</p>';

    const corSaldo = relatorio.saldoFinal >= 0 ? 'success' : 'error';

    return `
    <div id="modal-fecho-global-overlay" class="modal-overlay">
        <div class="modal-container">
            <header class="modal-header">
                <h3 class="modal-title">Relatório do Dia</h3>
                <button type="button" class="modal-close-button">&times;</button>
            </header>
            <div class="modal-body">
                <p class="report-date">${dataFormatada}</p>
                
                <div class="report-section grid-2-col">
                    <div class="report-highlight-card primary"><p class="highlight-label">Total Vendido</p><p class="highlight-value small">${formatarMoeda(relatorio.totalVendido)}</p></div>
                    <div class="report-highlight-card"><p class="highlight-label">Lucro Bruto</p><p class="highlight-value small success">${formatarMoeda(relatorio.lucroBruto)}</p></div>
                </div>

                <div class="report-section">
                    <div class="report-highlight-card bordered ${corSaldo}">
                        <p class="highlight-label bold">SALDO FINAL DO DIA</p>
                        <p class="highlight-value large">${formatarMoeda(relatorio.saldoFinal)}</p>
                    </div>
                </div>

                <div class="report-section">
                    <details class="accordion-item">
                        <summary class="accordion-header"><h4 class="accordion-title">Detalhe das Vendas</h4><i class="accordion-icon lni lni-chevron-down"></i></summary>
                        <div class="accordion-content"><div class="list-condensed scrollable">${produtosVendidosHTML}</div></div>
                    </details>
                    <details class="accordion-item">
                        <summary class="accordion-header"><h4 class="accordion-title">Detalhe das Despesas (${formatarMoeda(relatorio.totalDespesas)})</h4><i class="accordion-icon lni lni-chevron-down"></i></summary>
                        <div class="accordion-content">
                            <div class="list-condensed scrollable">${despesasHTML}</div>
                        </div>
                    </details>
                </div>
            </div>
            <footer id="footer-fecho-global" class="modal-footer"></footer>
        </div>
    </div>`;
};

function handleArquivarDia(closeModal, relatorio) {
    const state = store.getState();
    const hojeStr = new Date().toDateString();
    if (state.historicoFechos.some(r => new Date(r.data).toDateString() === hojeStr)) {
        return Toast.mostrarNotificacao("O dia de hoje já foi fechado e arquivado.", "erro");
    }
    if (relatorio.numContasFechadas === 0 && relatorio.totalDespesas === 0) {
        return Toast.mostrarNotificacao("Não existem transações para arquivar.", "info");
    }
    abrirModalConfirmacao(
        'Arquivar o Dia?',
        'Todas as contas fechadas serão arquivadas e o stock da loja será zerado. Esta ação não pode ser desfeita.',
        () => {
            store.dispatch({ type: 'ARCHIVE_DAY', payload: { relatorio } });
            closeModal();
            Toast.mostrarNotificacao("Dia arquivado com sucesso!");

            PWAService.showLocalNotification('Dia Fechado com Sucesso!', {
                body: `Saldo Final: ${formatarMoeda(relatorio.saldoFinal)} | Total Vendido: ${formatarMoeda(relatorio.totalVendido)}`,
                tag: 'fecho-diario'
            });
        }
    );
}

// *** NOVA FUNÇÃO PARA PARTILHAR/EXPORTAR RELATÓRIO ***
async function handleShareReport(relatorio, config) {
    const pdfBlob = gerarRelatorioPDFBlob(relatorio, config);
    const fileName = `Fecho-Dia-${new Date(relatorio.data).toISOString().split('T')[0]}.pdf`;
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    const shareData = {
        title: `Relatório de Fecho - ${config.businessName || 'Flui'}`,
        text: `Relatório de fecho do dia ${new Date(relatorio.data).toLocaleDateString('pt-PT')}.`,
        files: [pdfFile]
    };

    const shared = await PWAService.shareFiles(shareData.files, shareData);

    // Fallback: se a partilha falhar ou não for suportada, executa o download
    if (!shared) {
        Toast.mostrarNotificacao("A partilha não é suportada. A iniciar download...", "info");
        exportarRelatorioPDF(relatorio, config);
    }
}


export const mount = (closeModal, relatorio, isHistoric) => {
    const footer = document.getElementById('footer-fecho-global');
    if (isHistoric) {
        // Agora com um único botão de partilha
        footer.innerHTML = `
            <button id="btn-share-report" class="button button-secondary full-width"><i class="lni lni-share-alt"></i> Partilhar Relatório</button>`;
        document.getElementById('btn-share-report')?.addEventListener('click', () => handleShareReport(relatorio, store.getState().config));
    } else {
        footer.innerHTML = `<button id="btn-arquivar-dia" class="button button-primary full-width"><i class="lni lni-archive"></i> Arquivar e Fechar Dia</button>`;
        document.getElementById('btn-arquivar-dia')?.addEventListener('click', () => handleArquivarDia(closeModal, relatorio));
    }

    document.querySelector('.modal-close-button')?.addEventListener('click', closeModal);
    document.getElementById('modal-fecho-global-overlay')?.addEventListener('click', e => {
        if (e.target.id === 'modal-fecho-global-overlay') closeModal();
    });
};

export const unmount = () => {};