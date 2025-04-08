// craftraito/frontend/js/calculator.js
// ATUALIZADO: calculateCraftingCost agora aceita e usa custos opcionais para itens de profissão.

/**
 * Calcula o custo total dos materiais (baseado nos preços de mercado unitários e custos de profissão opcionais)
 * para uma quantidade de packs.
 * @param {Object} recipeData - Dados completos da receita vindos da API.
 * @param {Object} marketPricesUnit - Objeto com os preços de mercado UNITÁRIOS atuais { material_name: price }.
 * @param {number} desiredPacks - Quantidade de PACKS que se deseja fabricar.
 * @param {Object} [professionMaterialCosts={}] - Objeto opcional com custos unitários definidos pelo usuário para materiais de profissão { material_name: cost_per_unit }.
 * @returns {number} - O custo total calculado.
 */
export function calculateCraftingCost(recipeData, marketPricesUnit, desiredPacks, professionMaterialCosts = {}) {
    let totalCost = 0;
    // Validação inicial
    if (!recipeData || !recipeData.materials || desiredPacks <= 0) {
        console.warn("Dados inválidos para cálculo de custo (packs).", recipeData, desiredPacks);
        return 0;
    }

    recipeData.materials.forEach(material => {
        const totalQuantityNeeded = material.quantity * desiredPacks;

        if (material.material_type === 'drop' || material.material_type === 'buy') {
            const marketPriceUnit = marketPricesUnit[material.material_name];
            if (typeof marketPriceUnit !== 'number' || marketPriceUnit < 0) {
                console.warn(`Preço de mercado unitário inválido ou ausente para ${material.material_name}. Usando 0.`);
            }
            totalCost += totalQuantityNeeded * (marketPriceUnit || 0);
        // *** MUDANÇA: Adiciona lógica para custo de profissão ***
        } else if (material.material_type === 'profession') {
            const userDefinedCost = professionMaterialCosts[material.material_name];
            // Verifica se um custo foi definido E é um número válido >= 0
            if (typeof userDefinedCost === 'number' && userDefinedCost >= 0) {
                totalCost += totalQuantityNeeded * userDefinedCost;
                console.log(`[CostCalc] Incluindo custo de profissão para ${material.material_name}: ${totalQuantityNeeded} x ${userDefinedCost} = ${totalQuantityNeeded * userDefinedCost}`);
            }
            // Se não houver custo definido ou for inválido, não adiciona nada (custo zero)
        }
    });

    return totalCost;
}

/**
 * Calcula o lucro (ou prejuízo) ao vender a quantidade desejada de packs.
 * (Função sem modificações aqui)
 * @param {number} cost - O custo total de produção para a quantidade de packs desejada.
 * @param {Object} recipeData - Dados completos da receita (usa npc_sell_price por pack).
 * @param {{market: number}} sellPricesTotal - Preço TOTAL de venda no mercado para TODOS os packs { market: totalMarketSellPrice }.
 * @param {number} desiredPacks - Quantidade de PACKS que se está fabricando/vendendo.
 * @returns {{profitMarket: number, profitNPC: number, totalRevenueMarket: number, totalRevenueNPC: number}} Lucros e receitas totais.
 */
export function calculateProfit(cost, recipeData, sellPricesTotal, desiredPacks) {
     if (!recipeData || desiredPacks <= 0) {
        console.warn("Dados inválidos para cálculo de lucro (packs).", recipeData, desiredPacks);
         return { profitMarket: 0, profitNPC: 0, totalRevenueMarket: 0, totalRevenueNPC: 0 };
     }
    const totalRevenueMarket = sellPricesTotal.market || 0;
    const totalRevenueNPC = (recipeData.npc_sell_price || 0) * desiredPacks;
    const profitMarket = totalRevenueMarket - cost;
    const profitNPC = totalRevenueNPC - cost;
    return { profitMarket, profitNPC, totalRevenueMarket, totalRevenueNPC };
}

/**
 * Formata um número como moeda (simples, sem símbolo).
 * (Função sem modificações aqui)
 * @param {number} value - O valor a formatar.
 * @returns {string} - Valor formatado com separador de milhar.
 */
export function formatCurrency(value) {
    if (typeof value !== 'number') return '0';
    return Math.floor(value).toLocaleString('pt-BR');
}