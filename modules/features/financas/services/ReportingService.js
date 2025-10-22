// /modules/features/financas/services/ReportingService.js (COMPLETO E ATUALIZADO)
'use strict';

/**
 * Calcula o relatório de vendas e despesas para o dia atual.
 * @param {object} state - O estado completo da aplicação.
 * @returns {object} Os dados completos do relatório do dia.
 */
export function calcularRelatorioDia(state) {
    const hojeString = new Date().toDateString();
    const contasFechadasHoje = state.contasAtivas.filter(c => c.status === 'fechada' && new Date(c.dataFecho).toDateString() === hojeString);
    const despesasDoDia = state.despesas.filter(d => new Date(d.data).toDateString() === hojeString);
    
    let totalVendido = 0;
    let totalCustoVendido = 0;
    const produtosVendidos = {};

    contasFechadasHoje.forEach(conta => {
        totalVendido += conta.valorFinal;
        conta.pedidos.forEach(pedido => {
            totalCustoVendido += (pedido.custo || 0) * pedido.qtd;
            produtosVendidos[pedido.nome] = (produtosVendidos[pedido.nome] || 0) + pedido.qtd;
        });
    });

    const lucroBruto = totalVendido - totalCustoVendido;
    const totalDespesas = despesasDoDia.reduce((total, despesa) => total + despesa.valor, 0);
    const saldoFinal = lucroBruto - totalDespesas;
    
    const totalNumerario = contasFechadasHoje.filter(c => c.metodoPagamento === 'Numerário').reduce((sum, c) => sum + c.valorFinal, 0);
    const totalTpa = contasFechadasHoje.filter(c => c.metodoPagamento === 'TPA').reduce((sum, c) => sum + c.valorFinal, 0);
    const numContasFechadas = contasFechadasHoje.length;
    const mediaPorConta = numContasFechadas > 0 ? totalVendido / numContasFechadas : 0;

    return { 
        id: `fecho-${new Date().toISOString().split('T')[0]}`,
        data: new Date().toISOString(), 
        totalVendido, 
        totalCustoVendido,
        lucroBruto,
        totalDespesas,
        saldoFinal,
        totalNumerario, 
        totalTpa, 
        numContasFechadas, 
        mediaPorConta, 
        produtosVendidos,
        contasFechadas: contasFechadasHoje,
        despesasDoDia: despesasDoDia
    };
}


/**
 * Cria a instância base do documento PDF para um relatório diário.
 * @param {object} relatorio - Os dados do relatório.
 * @param {object} config - As configurações da aplicação.
 * @returns {jsPDF} A instância do documento jsPDF.
 */
function criarDocumentoPDF(relatorio, config) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const nomeEmpresa = config.businessName || 'Flui';
    const dataFormatada = new Date(relatorio.data).toLocaleDateString('pt-PT');
    
    doc.setFontSize(18);
    doc.text(nomeEmpresa, 14, 22);
    doc.setFontSize(12);
    doc.text(`Relatório de Fecho do Dia: ${dataFormatada}`, 14, 30);

    const formatCurrency = (value) => (value || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' });

    const estatisticasBody = [
        ['Total Vendido', formatCurrency(relatorio.totalVendido)],
        ['Lucro Bruto', formatCurrency(relatorio.lucroBruto)],
        ['Total Despesas', `- ${formatCurrency(relatorio.totalDespesas)}`],
        ['SALDO FINAL', formatCurrency(relatorio.saldoFinal)],
        [''],
        ['Total em Numerário', formatCurrency(relatorio.totalNumerario)],
        ['Total em TPA', formatCurrency(relatorio.totalTpa)],
        ['Contas Fechadas', relatorio.numContasFechadas],
        ['Média por Conta', formatCurrency(relatorio.mediaPorConta)],
    ];

    doc.autoTable({
        startY: 40,
        head: [['Sumário Financeiro', 'Valor']],
        body: estatisticasBody,
        theme: 'grid',
        didParseCell: function (data) {
            if (data.row.raw[0] === 'SALDO FINAL') {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.textColor = relatorio.saldoFinal >= 0 ? [0, 100, 0] : [255, 0, 0];
            }
        }
    });

    let lastY = doc.lastAutoTable.finalY + 10;
    
    const produtosVendidosOrdenados = Object.entries(relatorio.produtosVendidos).sort(([, a], [, b]) => b - a);

    if (produtosVendidosOrdenados.length > 0) {
        doc.autoTable({ startY: lastY, head: [['Quantidade', 'Produto Vendido']], body: produtosVendidosOrdenados.map(([nome, qtd]) => [qtd, nome]), theme: 'grid' });
        lastY = doc.lastAutoTable.finalY + 10;
    }

    if (relatorio.despesasDoDia.length > 0) {
        doc.autoTable({ startY: lastY, head: [['Descrição da Despesa', 'Valor']], body: relatorio.despesasDoDia.map(d => [d.descricao, formatCurrency(d.valor)]), theme: 'grid' });
    }

    return doc;
}

/**
 * Gera o relatório PDF como um objeto Blob, para ser usado pela Web Share API.
 * @param {object} relatorio - Os dados do relatório.
 * @param {object} config - As configurações da aplicação.
 * @returns {Blob} O ficheiro PDF como um Blob.
 */
export function gerarRelatorioPDFBlob(relatorio, config) {
    const doc = criarDocumentoPDF(relatorio, config);
    return doc.output('blob');
}

/**
 * Força o download do relatório de vendas do dia em PDF (Ação de Fallback).
 * @param {object} relatorio - Os dados do relatório.
 * @param {object} config - As configurações da aplicação.
 */
export function exportarRelatorioPDF(relatorio, config) {
    const doc = criarDocumentoPDF(relatorio, config);
    doc.save(`Fecho-Dia-${new Date(relatorio.data).toISOString().split('T')[0]}.pdf`);
}

/**
 * Exporta o relatório de vendas do dia para XLS (Excel).
 * @param {object} relatorio - Os dados do relatório.
 * @param {object} config - As configurações da aplicação.
 */
export function exportarRelatorioXLS(relatorio, config) {
    const nomeEmpresa = config.businessName || 'Flui';
    const dataFormatada = new Date(relatorio.data).toLocaleDateString('pt-PT');
    const dados = [
        [nomeEmpresa],
        [`Relatório de Fecho do Dia - ${dataFormatada}`],
        [],
        ["Sumário Financeiro", "Valor"],
        ["Total Vendido", relatorio.totalVendido],
        ["Lucro Bruto", relatorio.lucroBruto],
        ["Total Despesas", relatorio.totalDespesas],
        ["SALDO FINAL", relatorio.saldoFinal],
        [],
        ["Detalhes", "Valor"],
        ["Total em Numerário", relatorio.totalNumerario],
        ["Total em TPA", relatorio.totalTpa],
        ["Contas Fechadas", relatorio.numContasFechadas],
        ["Média por Conta", relatorio.mediaPorConta],
        [],
        ["Produtos Vendidos", "Quantidade"],
        ...Object.entries(relatorio.produtosVendidos).sort(([, a], [, b]) => b - a).map(([nome, qtd]) => [nome, qtd]),
        [],
        ["Despesas do Dia", "Valor"],
        ...relatorio.despesasDoDia.map(d => [d.descricao, d.valor])
    ];
    const ws = XLSX.utils.aoa_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fecho do Dia");
    XLSX.writeFile(wb, `Fecho-Dia-${new Date(relatorio.data).toISOString().split('T')[0]}.xlsx`);
}

// --- Funções para Histórico de Compras ---

function agruparComprasPorDia(compras) {
    const agrupado = new Map();
    compras.forEach(compra => {
        const dataStr = new Date(compra.data).toLocaleDateString('pt-PT');
        if (!agrupado.has(dataStr)) {
            agrupado.set(dataStr, { data: new Date(compra.data), compras: [], totalDia: 0 });
        }
        const dia = agrupado.get(dataStr);
        dia.compras.push(compra);
        dia.totalDia += compra.custoTotal || 0;
    });
    return agrupado;
}

export function exportarRelatorioComprasPDF(compras, state, startDate, endDate) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const { config, fornecedores, inventario } = state;
    const nomeEmpresa = config.businessName || 'Flui';
    const periodoStr = `${startDate.toLocaleDateString('pt-PT')} a ${endDate.toLocaleDateString('pt-PT')}`;

    doc.setFontSize(18);
    doc.text(nomeEmpresa, 14, 22);
    doc.setFontSize(12);
    doc.text(`Relatório de Compras: ${periodoStr}`, 14, 30);

    const comprasAgrupadas = agruparComprasPorDia(compras);
    let yPos = 40;

    for (const [dataStr, dadosDia] of comprasAgrupadas) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Dia: ${dataStr}`, 14, yPos);
        yPos += 7;

        const body = dadosDia.compras.map(c => {
            const fornecedorNome = fornecedores.find(f => f.id === c.fornecedorId)?.nome || 'N/A';
            const produtoNome = inventario.find(p => p.id === c.produtoId)?.nome || 'Produto Removido';
            return [produtoNome, fornecedorNome, c.quantidade, (c.custoTotal || 0).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })];
        });

        doc.autoTable({
            startY: yPos,
            head: [['Produto', 'Fornecedor', 'Qtd.', 'Valor Total']],
            body: body,
            didDrawPage: (data) => { yPos = data.cursor.y; }
        });

        yPos = doc.lastAutoTable.finalY + 5;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text(`Total do Dia: ${dadosDia.totalDia.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`, 14, yPos);
        yPos += 10;
    }
    doc.save(`Relatorio-Compras-${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportarRelatorioComprasXLS(compras, state, startDate, endDate) {
    const { config, fornecedores, inventario } = state;
    const nomeEmpresa = config.businessName || 'Flui';
    const periodoStr = `${startDate.toLocaleDateString('pt-PT')} a ${endDate.toLocaleDateString('pt-PT')}`;
    const dados = [
        [nomeEmpresa],
        [`Relatório de Compras - ${periodoStr}`],
        [],
        ["Data", "Produto", "Fornecedor", "Quantidade", "Valor Total", "Método de Pagamento"]
    ];

    compras.forEach(c => {
        const fornecedorNome = fornecedores.find(f => f.id === c.fornecedorId)?.nome || 'N/A';
        const produtoNome = inventario.find(p => p.id === c.produtoId)?.nome || 'Produto Removido';
        dados.push([new Date(c.data).toLocaleDateString('pt-PT'), produtoNome, fornecedorNome, c.quantidade, c.custoTotal || 0, c.metodoPagamento]);
    });
    const ws = XLSX.utils.aoa_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Histórico de Compras");
    XLSX.writeFile(wb, `Relatorio-Compras-${new Date().toISOString().split('T')[0]}.xlsx`);
}