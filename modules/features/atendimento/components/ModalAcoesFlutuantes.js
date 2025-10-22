// /modules/features/atendimento/components/ModalAcoesFlutuantes.js (REFATORADO COM ESTRUTURA SEMÂNTICA)
'use strict';

export const render = (titulo, botoes = []) => {
    const botoesHTML = botoes.map(btn => `
        <button class="button-list-item"
                data-acao="${btn.acao}"
                style="color: ${btn.cor || 'var(--text-primary)'};">
            <i class="lni ${btn.icone || ''}" style="color: ${btn.cor || 'var(--text-secondary)'};"></i>
            <span>${btn.texto}</span>
        </button>
    `).join('');

    return `
<div id="modal-acoes-flutuantes-overlay" class="modal-overlay bottom-sheet">
    <div class="modal-container bottom-sheet-container">
        <header class="modal-header">
            <h3 class="modal-title">${titulo}</h3>
        </header>
        <div class="modal-body">
            ${botoesHTML}
        </div>
        <footer class="modal-footer">
             <button id="btn-cancelar-acoes-flutuantes" class="button button-secondary full-width">Cancelar</button>
        </footer>
    </div>
</div>`;
};

export const mount = (closeModal, titulo, botoes = []) => {
    const container = document.getElementById('modal-acoes-flutuantes-overlay');

    container.addEventListener('click', e => {
        const targetButton = e.target.closest('button[data-acao]');
        if (targetButton) {
            const acao = targetButton.dataset.acao;
            const botaoConfig = botoes.find(b => b.acao === acao);
            if (botaoConfig && typeof botaoConfig.callback === 'function') {
                botaoConfig.callback();
            }
            closeModal();
            return;
        }

        if (e.target.closest('#btn-cancelar-acoes-flutuantes') || e.target.id === 'modal-acoes-flutuantes-overlay') {
            closeModal();
        }
    });
};

export const unmount = () => {};