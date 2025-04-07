import * as api from '../apiService.js';
import * as ui from '../ui.js';
import * as calculator from '../calculator.js';

// IDs dos elementos do DOM
const elements = {
    // Removido: calculateSelect
    calculateItemList: 'calculate-item-list', // Container dos cards
    calculateLoadingMsg: 'calculate-loading-message', // Mensagem de loading inicial
    openModalButton: 'open-calculate-modal-button', // Este ID não é mais usado centralmente
    calculationModal: 'calculation-modal',
    modalCloseButton: 'modal-close-button',
    modalConfirmButton: 'modal-confirm-button',
    modalItemNameSpan: 'modal-item-name',
    modalCraftQuantityInput: 'modal-craft-quantity',
    modalTotalItemsLabel: 'modal-total-items-label',
    modalMaterialsList: 'modal-materials-list',
    modalSellPriceMarketInput: 'modal-sell-price-market',
    modalSellPriceNpcBaseSpan: 'modal-sell-price-npc-base',
    modalSellPriceNpcTotalSpan: 'modal-sell-price-npc-total',
    modalCalcPacksLabelNpc: 'modal-calc-packs-label-npc',
    modalResultsDiv: 'modal-results',
    modalCalcPacksLabelResults: 'modal-calc-packs-label-results',
    modalResultCost: 'modal-result-cost',
    modalResultRevenueMarket: 'modal-result-revenue-market',
    modalResultRevenueNpc: 'modal-result-revenue-npc',
    modalResultProfitMarket: 'modal-result-profit-market',
    modalResultProfitNpc: 'modal-result-profit-npc',
    modalCompensaMarket: 'modal-compensa-market',
    modalCompensaNpc: 'modal-compensa-npc',
    modalProfitPercentageMarket: 'modal-profit-percentage-market',
    modalStatus: 'modal-status',
    calculateStatus: 'calculate-status'
};

let domElements = {};
let currentRecipeData = null; // Guarda dados da receita ATUALMENTE no modal

/**
 * Inicializa a view de cálculo.
 */
// Substitua a função initCalculateView inteira por esta versão:
export function initCalculateView() {
    console.log("[calculateView] Inicializando..."); // Log 1: Iniciou a função

    // Busca todas as referências do DOM de uma vez
    domElements = Object.keys(elements).reduce((acc, key) => {
        // Log antes de buscar cada elemento essencial
        if (elements[key] === 'calculate-loading-message') { // Log específico para o elemento problemático
             console.log(`[calculateView] Tentando buscar elemento com ID: #${elements[key]}`);
        }
        acc[key] = document.getElementById(elements[key]);
        // Log depois de buscar o elemento problemático
        if (elements[key] === 'calculate-loading-message') {
             console.log(`[calculateView] Resultado para #${elements[key]}:`, acc[key]); // Mostra null se não encontrou
        }
        return acc;
    }, {});

    // Verifica se todos os elementos essenciais foram encontrados
    const essentialElements = [
        'calculateItemList', 'calculateLoadingMsg', 'calculationModal', 'modalCloseButton',
        'modalConfirmButton', 'modalMaterialsList', 'modalResultsDiv',
        'modalCraftQuantityInput', 'modalSellPriceMarketInput', 'modalSellPriceNpcBaseSpan',
        'modalItemNameSpan', 'modalTotalItemsLabel', 'modalSellPriceNpcTotalSpan',
        'modalCalcPacksLabelNpc', 'modalCalcPacksLabelResults', 'modalProfitPercentageMarket'
    ];
    const missingElement = essentialElements.find(key => {
        // Log extra para identificar qual elemento específico está faltando
        if (!domElements[key]) {
             console.warn(`[calculateView] Verificação falhou para a chave: ${key}, esperando ID: #${elements[key]}`);
        }
        return !domElements[key];
    });

    if (missingElement) {
        // O erro original acontece aqui
        console.error(`[calculateView] ERRO FATAL: Elemento essencial não encontrado: #${elements[missingElement]}`);
        ui.showStatusMessage(elements.calculateStatus, `Erro: Falha ao carregar UI (${elements[missingElement]}).`, "error");
        return; // Interrompe a inicialização se faltar algo
    }
    console.log("[calculateView] Todos elementos essenciais encontrados."); // Log 2: Passou na verificação

    // Limpa event listeners antigos do modal (boa prática)
    // (CloneNode é uma forma de fazer isso, mas pode ser pesado. Atenção se houver problemas.)
    try {
        domElements.modalCloseButton.replaceWith(domElements.modalCloseButton.cloneNode(true));
        domElements.modalConfirmButton.replaceWith(domElements.modalConfirmButton.cloneNode(true));
        domElements.modalCraftQuantityInput.replaceWith(domElements.modalCraftQuantityInput.cloneNode(true));
        // Re-busca referências após clonar
        domElements.modalCloseButton = document.getElementById(elements.modalCloseButton);
        domElements.modalConfirmButton = document.getElementById(elements.modalConfirmButton);
        domElements.modalCraftQuantityInput = document.getElementById(elements.modalCraftQuantityInput);

        // Re-anexa Listeners do Modal
        domElements.modalCloseButton.addEventListener('click', closeCalculationModal);
        domElements.modalConfirmButton.addEventListener('click', handleModalConfirm);
        domElements.modalCraftQuantityInput.addEventListener('input', updateDynamicModalValues);
         console.log("[calculateView] Listeners do modal re-anexados."); // Log 3: Listeners OK
    } catch(e) {
         console.error("[calculateView] Erro ao clonar/reanexar listeners do modal:", e);
         // Se clonagem falhar, tenta anexar aos originais (menos seguro contra duplicatas)
         domElements.modalCloseButton.addEventListener('click', closeCalculationModal);
         domElements.modalConfirmButton.addEventListener('click', handleModalConfirm);
         domElements.modalCraftQuantityInput.addEventListener('input', updateDynamicModalValues);
    }


    // Carrega e RENDERIZA a lista de itens ao inicializar
    loadAndRenderItems(); // Log 4: Vai carregar itens
}

// IMPORTANTE: As outras funções DENTRO de calculateView.js (loadAndRenderItems, renderCalculateItemList, etc.) permanecem as mesmas da resposta anterior.
// Apenas a função initCalculateView foi modificada acima para adicionar os console.log.

/**
 * Carrega itens da API e chama a função para renderizar os cards.
 */
async function loadAndRenderItems() {
    // Mostra mensagem de loading inicial, esconde container
    if (domElements.calculateLoadingMsg) domElements.calculateLoadingMsg.style.display = 'block';
    if (domElements.calculateItemList) domElements.calculateItemList.innerHTML = ''; // Limpa cards antigos
    ui.hideStatusMessage(elements.calculateStatus); // Esconde status antigo

    try {
        const items = await api.fetchItems();
        renderCalculateItemList(items); // Chama a nova função de renderização
        if (domElements.calculateLoadingMsg) domElements.calculateLoadingMsg.style.display = 'none'; // Esconde loading
        if (!items || items.length === 0) {
            ui.showStatusMessage(elements.calculateStatus, "Nenhum item registrado para calcular.", "info");
        }
    } catch (error) {
        console.error("Erro ao carregar itens para cálculo:", error);
        if (domElements.calculateLoadingMsg) domElements.calculateLoadingMsg.textContent = 'Erro ao carregar itens.';
        ui.showStatusMessage(elements.calculateStatus, `Erro ao carregar itens: ${error.message || 'Verifique o console e o backend.'}`, "error");
    }
}

/**
 * Renderiza os cards de item na página de cálculo.
 * @param {Array} items - Array de itens da API.
 */
function renderCalculateItemList(items) {
    const container = domElements.calculateItemList;
    if (!container) return;
    container.innerHTML = ''; // Limpa container

    if (!items || items.length === 0) {
        // Mensagem já é tratada em loadAndRenderItems, mas pode adicionar aqui se preferir
        // container.innerHTML = '<p>Nenhum item registrado.</p>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'item-card-info';

        const nameH3 = document.createElement('h3');
        nameH3.className = 'item-card-name';
        nameH3.textContent = item.name;

        const detailsP = document.createElement('p');
        detailsP.className = 'item-card-details';
        const npcPriceFormatted = ui.formatCurrency ? ui.formatCurrency(item.npc_sell_price || 0) : (item.npc_sell_price || 0);
        detailsP.textContent = `Preço NPC (Pack): ${npcPriceFormatted}`;

        infoDiv.appendChild(nameH3);
        infoDiv.appendChild(detailsP);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'item-card-actions';

        const calcButton = document.createElement('button');
        calcButton.textContent = 'Calcular Lucro';
        calcButton.className = 'button button-primary';
        calcButton.dataset.id = item.id; // Guarda o ID no botão
        calcButton.addEventListener('click', (e) => {
            // Adiciona um estado de loading ao botão clicado
            const button = e.target;
            const originalText = button.textContent;
            button.textContent = 'Carregando...';
            button.disabled = true;
            prepareAndOpenCalculateModal(item.id).finally(() => {
                // Restaura o botão após abrir modal ou dar erro
                button.textContent = originalText;
                button.disabled = false;
            });
        });

        actionsDiv.appendChild(calcButton);
        card.appendChild(infoDiv);
        card.appendChild(actionsDiv);
        container.appendChild(card);
    });
}

/**
 * Busca os dados da receita e abre o modal de cálculo.
 * @param {string|number} itemId - O ID do item a ser calculado.
 */
async function prepareAndOpenCalculateModal(itemId) {
    ui.showStatusMessage(elements.calculateStatus, `Buscando detalhes para item ID: ${itemId}...`, 'loading');
    try {
        const recipeData = await api.fetchRecipe(itemId);
        if (recipeData) {
            currentRecipeData = recipeData; // Guarda a receita atual para o modal
            openCalculationModal(); // Abre o modal com os dados carregados
            ui.hideStatusMessage(elements.calculateStatus);
        } else {
            ui.showStatusMessage(elements.calculateStatus, `Item ID: ${itemId} não encontrado ou sem receita.`, "error");
        }
    } catch (error) {
        console.error("Erro ao buscar receita para modal:", error);
        ui.showStatusMessage(elements.calculateStatus, `Erro ao buscar detalhes: ${error.message || 'Erro desconhecido.'}`, "error");
    }
}

// --- Funções do Modal (openCalculationModal, closeCalculationModal, updateDynamicModalValues, handleModalConfirm, displayModalResults) ---
// O CÓDIGO DESSAS FUNÇÕES PERMANECE O MESMO DA RESPOSTA ANTERIOR (RESPOSTA #19)
// Certifique-se de que elas estão presentes aqui no seu arquivo, logo abaixo.
// (Vou incluí-las novamente abaixo para garantir a completude deste arquivo)

/**
 * Abre e preenche o modal de cálculo com base em Packs.
 */
function openCalculationModal() {
    // Note: currentRecipeData já foi buscado por prepareAndOpenCalculateModal
    if (!currentRecipeData) {
        ui.showStatusMessage(elements.calculateStatus, "Dados da receita não disponíveis.", "error");
        return;
    }

    domElements.modalItemNameSpan.textContent = currentRecipeData.name;
    domElements.modalCraftQuantityInput.value = 1; // Sempre começa com 1 pack

    domElements.modalMaterialsList.innerHTML = '';
    currentRecipeData.materials.forEach(mat => {
        const li = document.createElement('li');
        let content = `${mat.quantity}x ${mat.material_name}`;
        if (mat.material_type === 'profession') {
            content += ` (Profissão)`;
        } else {
            const npcPriceFormatted = calculator.formatCurrency(mat.default_npc_price || 0);
            content += ` (NPC Ref: ${npcPriceFormatted}) - Mercado: <input type='number' min='0' value='0' data-material-name='${mat.material_name}' class='modal-material-market-price'>`;
        }
        li.innerHTML = content;
        domElements.modalMaterialsList.appendChild(li);
    });

    domElements.modalSellPriceNpcBaseSpan.textContent = calculator.formatCurrency(currentRecipeData.npc_sell_price || 0);
    domElements.modalSellPriceMarketInput.value = '0';

    updateDynamicModalValues(); // Atualiza totais para 1 pack inicial

    domElements.modalResultsDiv.style.display = 'none';
    if (domElements.modalProfitPercentageMarket) domElements.modalProfitPercentageMarket.textContent = '';
    ui.hideStatusMessage(elements.modalStatus);

    domElements.calculationModal.style.display = 'block';
}

/**
 * Fecha o modal de cálculo.
 */
function closeCalculationModal() {
    if (domElements.calculationModal) {
        domElements.calculationModal.style.display = 'none';
    }
    // Limpa a receita atual ao fechar para evitar usar dados errados se outro item for clicado rapidamente
    currentRecipeData = null;
}

/**
 * Atualiza os valores dinâmicos no modal (Total de Itens, Total NPC)
 */
function updateDynamicModalValues() {
    if (!currentRecipeData || !domElements.modalCraftQuantityInput || !domElements.modalTotalItemsLabel || !domElements.modalSellPriceNpcTotalSpan || !domElements.modalCalcPacksLabelNpc) return;

    const desiredPacks = parseInt(domElements.modalCraftQuantityInput.value, 10) || 0;
    const baseQuantity = currentRecipeData.quantity_produced || 1;
    const totalItems = desiredPacks * baseQuantity;
    const totalNpcPrice = (currentRecipeData.npc_sell_price || 0) * desiredPacks;

    domElements.modalTotalItemsLabel.textContent = calculator.formatCurrency(totalItems);
    domElements.modalCalcPacksLabelNpc.textContent = desiredPacks;
    domElements.modalSellPriceNpcTotalSpan.textContent = calculator.formatCurrency(totalNpcPrice);

    if(domElements.modalCalcPacksLabelResults) {
        domElements.modalCalcPacksLabelResults.textContent = desiredPacks;
    }
}

/**
 * Lida com a confirmação do cálculo no modal (lógica baseada em Packs).
 */
function handleModalConfirm() {
    if (!currentRecipeData) return;

    ui.showStatusMessage(elements.modalStatus, "Calculando...", "loading");

    const desiredPacks = parseInt(domElements.modalCraftQuantityInput.value, 10);
    if (isNaN(desiredPacks) || desiredPacks <= 0) {
        ui.showStatusMessage(elements.modalStatus, "Quantidade de Packs inválida.", "error");
        return;
    }

    const marketPricesMaterials = {};
    const priceInputs = domElements.modalMaterialsList.querySelectorAll('.modal-material-market-price');
    priceInputs.forEach(input => {
        const matName = input.dataset.materialName;
        marketPricesMaterials[matName] = parseFloat(input.value) || 0;
    });

    const marketSellPricePerPack = parseFloat(domElements.modalSellPriceMarketInput.value);
    if (isNaN(marketSellPricePerPack) || marketSellPricePerPack < 0) {
        ui.showStatusMessage(elements.modalStatus, "Preço de venda de mercado (por Pack) inválido.", "error");
        return;
    }

    try {
        const totalCost = calculator.calculateCraftingCost(currentRecipeData, marketPricesMaterials, desiredPacks);
        const totalMarketRevenue = marketSellPricePerPack * desiredPacks;
        const sellPricesForCalc = { market: totalMarketRevenue };
        const profitResults = calculator.calculateProfit(totalCost, currentRecipeData, sellPricesForCalc, desiredPacks);

        displayModalResults(totalCost, profitResults, desiredPacks);
        ui.hideStatusMessage(elements.modalStatus);

    } catch (error) {
        console.error("Erro durante cálculo:", error);
        ui.showStatusMessage(elements.modalStatus, `Erro no cálculo: ${error.message || 'Erro desconhecido.'}`, "error");
        domElements.modalResultsDiv.style.display = 'none';
    }
}

/**
 * Exibe os resultados do cálculo dentro do modal, incluindo a porcentagem de lucro do mercado.
 */
function displayModalResults(cost, profits, packsCalculated) {
    if (domElements.modalCalcPacksLabelResults) {
        domElements.modalCalcPacksLabelResults.textContent = packsCalculated;
    }
    domElements.modalResultCost.textContent = calculator.formatCurrency(cost);
    domElements.modalResultRevenueMarket.textContent = calculator.formatCurrency(profits.totalRevenueMarket);
    domElements.modalResultRevenueNpc.textContent = calculator.formatCurrency(profits.totalRevenueNPC);
    domElements.modalResultProfitMarket.textContent = calculator.formatCurrency(profits.profitMarket);
    domElements.modalResultProfitNpc.textContent = calculator.formatCurrency(profits.profitNPC);

    const compensaMarket = domElements.modalCompensaMarket;
    const compensaNpc = domElements.modalCompensaNpc;
    if (compensaMarket) {
        compensaMarket.textContent = profits.profitMarket > 0 ? '(Compensa)' : profits.profitMarket < 0 ? '(Não Compensa)' : '(Neutro)';
        compensaMarket.style.color = profits.profitMarket >= 0 ? 'green' : 'red';
    }
     if (compensaNpc) {
        compensaNpc.textContent = profits.profitNPC > 0 ? '(Compensa)' : profits.profitNPC < 0 ? '(Não Compensa)' : '(Neutro)';
        compensaNpc.style.color = profits.profitNPC >= 0 ? 'green' : 'red';
     }

    const percentageSpan = domElements.modalProfitPercentageMarket;
    if (percentageSpan) {
        let marketProfitPercentageText = '- %';
        let percentageColor = 'inherit';
        if (cost > 0) {
            const marketProfitPercentage = (profits.profitMarket / cost) * 100;
            marketProfitPercentageText = `(${marketProfitPercentage.toFixed(1)}%)`;
            percentageColor = profits.profitMarket >= 0 ? 'green' : 'red';
        } else if (profits.profitMarket > 0) {
            marketProfitPercentageText = '(∞%)';
            percentageColor = 'green';
        }
        percentageSpan.textContent = marketProfitPercentageText;
        percentageSpan.style.color = percentageColor;
    }

    if (domElements.modalResultsDiv) {
        domElements.modalResultsDiv.style.display = 'block';
    }
}