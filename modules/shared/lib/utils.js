// /modules/shared/lib/utils.js (ATUALIZADO COM GERADORES DE AVATAR)
'use strict';

/**
 * Agrupa uma sequência de chamadas de função numa única chamada após um atraso.
 */
export function debounce(func, delay = 300) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

/**
 * Calcula o estado da aplicação após a ação de arquivar o dia.
 */
export function gerarEstadoAposArquivo(state) {
    const contasAtivasAposArquivo = state.contasAtivas.filter(c => c.status === 'ativa');
    const contasFechadasParaApagar = state.contasAtivas.filter(c => c.status === 'fechada');

    const inventarioAtualizado = state.inventario.map(item => ({
        ...item,
        stockArmazem: item.stockArmazem + item.stockLoja,
        stockLoja: 0
    }));
    
    return { 
        contasAtivasAposArquivo, 
        inventarioAtualizado, 
        contasFechadasParaApagar 
    };
}

/**
 * Formata um número como moeda no padrão angolano (Kz).
 */
export function formatarMoeda(valor) {
    const valorNumerico = Number(valor) || 0;
    return valorNumerico.toLocaleString('pt-AO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' Kz';
}

/**
 * NOVO: Gera as iniciais a partir de um nome completo.
 * @param {string} nome O nome completo.
 * @returns {string} As iniciais (ex: "LD" para "Ladi Dji").
 */
export function gerarIniciais(nome) {
    if (!nome || typeof nome !== 'string') return '';
    const partes = nome.trim().split(' ');
    if (partes.length > 1) {
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }
    return (partes[0][0] || '').toUpperCase();
}

/**
 * NOVO: Gera um avatar em formato SVG (como Data URL) a partir das iniciais.
 * @param {string} iniciais As iniciais a serem exibidas.
 * @returns {string} Uma string Data URL representando a imagem SVG.
 */
export function gerarAvatarDeIniciaisSVG(iniciais) {
    const corDeFundo = '#006D38'; // Nosso --brand-primary
    const corDoTexto = '#FFFFFF'; // Nosso --brand-primary-text

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="${corDeFundo}" />
            <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="${corDoTexto}" font-size="40" font-family="sans-serif" font-weight="600">
                ${iniciais}
            </text>
        </svg>
    `;
    // Codifica o SVG para ser usado num atributo src de imagem
    return `data:image/svg+xml;base64,${btoa(svg)}`;
}