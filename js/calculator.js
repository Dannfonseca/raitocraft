/**
 * Calcula o custo total dos materiais (baseado nos preços de mercado unitários) para uma quantidade de packs.
 * Materiais de 'profession' são custo zero.
 * @param {Object} recipeData - Dados completos da receita vindos da API.
 * @param {Object} marketPricesUnit - Objeto com os preços de mercado UNITÁRIOS atuais { material_name: price }.
 * @param {number} desiredPacks - Quantidade de PACKS que se deseja fabricar.
 * @returns {number} - O custo total calculado.
 */
export function calculateCraftingCost(recipeData, marketPricesUnit, desiredPacks) {
    let totalCost = 0;
    // Validação inicial
    if (!recipeData || !recipeData.materials || desiredPacks <= 0) {
        console.warn("Dados inválidos para cálculo de custo (packs).", recipeData, desiredPacks);
        return 0;
    }

    recipeData.materials.forEach(material => {
        // Calcula custo apenas para tipos 'drop' ou 'buy'
        if (material.material_type === 'drop' || material.material_type === 'buy') {
            const marketPriceUnit = marketPricesUnit[material.material_name]; // Preço unitário do mercado
            if (typeof marketPriceUnit !== 'number' || marketPriceUnit < 0) {
                console.warn(`Preço de mercado unitário inválido ou ausente para ${material.material_name}. Usando 0.`);
            }
             // Quantidade TOTAL necessária do material = (Qtd por Receita) * (Número de Packs)
            const totalQuantityNeeded = material.quantity * desiredPacks;
            totalCost += totalQuantityNeeded * (marketPriceUnit || 0); // Custo = Qtd Total * Preço Unitário
        }
        // Custo de material 'profession' é considerado 0
    });

    return totalCost;
}

/**
 * Calcula o lucro (ou prejuízo) ao vender a quantidade desejada de packs.
 * @param {number} cost - O custo total de produção para a quantidade de packs desejada.
 * @param {Object} recipeData - Dados completos da receita (usa npc_sell_price por pack).
 * @param {{market: number}} sellPricesTotal - Preço TOTAL de venda no mercado para TODOS os packs { market: totalMarketSellPrice }.
 * @param {number} desiredPacks - Quantidade de PACKS que se está fabricando/vendendo.
 * @returns {{profitMarket: number, profitNPC: number, totalRevenueMarket: number, totalRevenueNPC: number}} Lucros e receitas totais.
 */
export function calculateProfit(cost, recipeData, sellPricesTotal, desiredPacks) {
     // Validação inicial
     if (!recipeData || desiredPacks <= 0) {
        console.warn("Dados inválidos para cálculo de lucro (packs).", recipeData, desiredPacks);
         return { profitMarket: 0, profitNPC: 0, totalRevenueMarket: 0, totalRevenueNPC: 0 };
     }

    // Receita TOTAL de mercado (já vem calculada)
    const totalRevenueMarket = sellPricesTotal.market || 0;

    // Receita TOTAL NPC = (Preço NPC por Pack Base) * (Número de Packs)
     const totalRevenueNPC = (recipeData.npc_sell_price || 0) * desiredPacks;


    const profitMarket = totalRevenueMarket - cost;
    const profitNPC = totalRevenueNPC - cost;

    return { profitMarket, profitNPC, totalRevenueMarket, totalRevenueNPC };
}

/**
 * Formata um número como moeda (simples, sem símbolo).
 * @param {number} value - O valor a formatar.
 * @returns {string} - Valor formatado com separador de milhar.
 */
export function formatCurrency(value) {
    if (typeof value !== 'number') return '0';
    // Usar toLocaleString para formatação básica
    // Garantir que não use centavos se não for necessário ou se o jogo não usa
    return Math.floor(value).toLocaleString('pt-BR'); // Usando Math.floor para remover centavos, ajuste se precisar
}