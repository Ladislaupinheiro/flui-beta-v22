// /modules/shared/services/CatalogoService.js (VALIDADO)
'use strict';

/**
 * Módulo de serviço para gerir o acesso ao catálogo de produtos padrão.
 * Implementa um cache em memória para evitar múltiplas leituras do ficheiro JSON.
 */

let catalogoCache = null; // Cache para armazenar os produtos após o primeiro carregamento.

/**
 * Carrega e retorna a lista de produtos do ficheiro produtos-padrao-ao.json.
 * Se o catálogo já foi carregado, retorna a versão em cache.
 * @returns {Promise<Array<object>>} Uma promessa que resolve com o array de produtos padrão.
 */
export async function getProdutosPadrao() {
    if (catalogoCache) {
        console.log('[CatalogoService] Retornando catálogo do cache.'); // Log adicionado para clareza
        return catalogoCache;
    }

    try {
        console.log('[CatalogoService] Carregando catálogo do ficheiro JSON...'); // Log adicionado
        const response = await fetch('./produtos-padrao-ao.json');
        if (!response.ok) {
            throw new Error(`Erro de rede ao carregar o catálogo: ${response.statusText}`);
        }
        const produtos = await response.json();
        catalogoCache = produtos;
        console.log(`[CatalogoService] Catálogo de ${catalogoCache.length} produtos padrão carregado com sucesso.`);
        return catalogoCache;
    } catch (error) {
        console.error('[CatalogoService] Falha ao carregar ou processar o catálogo de produtos:', error);
        catalogoCache = []; // Define cache como vazio em caso de erro
        return []; // Retorna um array vazio em caso de erro para evitar que a app quebre.
    }
}