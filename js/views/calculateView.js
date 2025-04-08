// craftraito/frontend/js/views/calculateView.js
// ATUALIZADO: Adiciona botão "+ Custo" para itens de profissão, revelando input opcional.
// Coleta custos de profissão em handleModalConfirm e passa para calculateCraftingCost.
import * as api from '../apiService.js';
import * as ui from '../ui.js';
import * as calculator from '../calculator.js';

// IDs dos elementos do DOM (sem mudanças)
const elements = { /* ... (ids iguais ao anterior) ... */
    calculateItemList: 'calculate-item-list',
    calculateLoadingMsg: 'calculate-loading-message',
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
    modalProfitPerProfMatLine: 'modal-result-profit-per-prof-mat-line',
    modalProfitPerProfMatValue: 'modal-result-profit-per-prof-mat',
    profMatNameSpan: '.prof-mat-name',
    modalStatus: 'modal-status',
    calculateStatus: 'calculate-status'
};

let domElements = {};
let currentRecipeData = null;

// --- validateAndUpdateLotInputs, initCalculateView, loadItemsForEditing, renderCalculateItemList, prepareAndOpenCalculateModal ---
// --- Funções sem modificações significativas aqui (já incluem validação visual de 3 estados) ---
function validateAndUpdateLotInputs(materialLiElement) {
    if (!materialLiElement) return;
    const totalNeededString = materialLiElement.dataset.totalNeeded;
    const totalMaterialNeeded = parseInt(totalNeededString, 10);
    const qtyInputs = materialLiElement.querySelectorAll('.market-qty-input');
    if (qtyInputs.length === 0 || isNaN(totalMaterialNeeded)) {
        qtyInputs.forEach(input => { input.classList.remove('input-valid', 'input-invalid', 'input-warning'); });
        return;
    }
    let sumOfLotQuantities = 0;
    qtyInputs.forEach(input => { sumOfLotQuantities += parseInt(input.value, 10) || 0; });
    let stateClass = '';
    if (sumOfLotQuantities === totalMaterialNeeded) { stateClass = 'input-valid'; }
    else if (sumOfLotQuantities < totalMaterialNeeded && sumOfLotQuantities >= 0) { stateClass = 'input-warning'; }
    else { stateClass = 'input-invalid'; }
    qtyInputs.forEach(input => {
        input.classList.remove('input-valid', 'input-invalid', 'input-warning');
        if (stateClass) { input.classList.add(stateClass); }
    });
}
export function initCalculateView() {
    console.log("[calculateView] Inicializando...");
    domElements = Object.keys(elements).reduce((acc, key) => { if (key !== 'profMatNameSpan') { acc[key] = document.getElementById(elements[key]); } return acc; }, {});
    const essentialElementIds = Object.keys(elements).filter(key => key !== 'profMatNameSpan');
    const missingElement = essentialElementIds.find(key => !domElements[key]);
    if (missingElement) { console.error(`[calculateView] ERRO FATAL: Elemento não encontrado: #${elements[missingElement]}`); if(domElements.calculateStatus) { ui.showStatusMessage(elements.calculateStatus, `Erro: Falha ao carregar UI (${elements[missingElement]}).`, "error"); } return; }
    console.log("[calculateView] Todos elementos essenciais encontrados.");
    try {
        const oldClose = domElements.modalCloseButton; const newClose = oldClose.cloneNode(true); oldClose.parentNode.replaceChild(newClose, oldClose); domElements.modalCloseButton = newClose;
        const oldConfirm = domElements.modalConfirmButton; const newConfirm = oldConfirm.cloneNode(true); oldConfirm.parentNode.replaceChild(newConfirm, oldConfirm); domElements.modalConfirmButton = newConfirm;
        const oldQtyInput = domElements.modalCraftQuantityInput; const newQtyInput = oldQtyInput.cloneNode(true); oldQtyInput.parentNode.replaceChild(newQtyInput, oldQtyInput); domElements.modalCraftQuantityInput = newQtyInput;
        if (domElements.modalMaterialsList._eventListenerInput) { domElements.modalMaterialsList.removeEventListener('input', domElements.modalMaterialsList._eventListenerInput); domElements.modalMaterialsList._eventListenerInput = null; }
        domElements.modalCloseButton.addEventListener('click', closeCalculationModal);
        domElements.modalConfirmButton.addEventListener('click', handleModalConfirm);
        domElements.modalCraftQuantityInput.addEventListener('input', updateDynamicModalValues);
        const inputHandler = (event) => { if (event.target.classList.contains('market-qty-input')) { const li = event.target.closest('li'); if (li) validateAndUpdateLotInputs(li); }};
        domElements.modalMaterialsList.addEventListener('input', inputHandler);
        domElements.modalMaterialsList._eventListenerInput = inputHandler;
        console.log("[calculateView] Listeners do modal re-anexados.");
    } catch(e) { console.error("[calculateView] Erro ao gerenciar listeners do modal:", e); /* Fallback listeners... */ }
    loadItemsForEditing();
}
async function loadItemsForEditing() {
    if (domElements.calculateLoadingMsg) domElements.calculateLoadingMsg.style.display = 'block'; if (domElements.calculateItemList) domElements.calculateItemList.innerHTML = ''; ui.hideStatusMessage(elements.calculateStatus);
    try {
        const items = await api.fetchItems(); renderCalculateItemList(items);
        if (domElements.calculateLoadingMsg) domElements.calculateLoadingMsg.style.display = 'none'; if (!items || items.length === 0) { ui.showStatusMessage(elements.calculateStatus, "Nenhum item registrado.", "info"); }
    } catch (error) { console.error("Erro ao carregar itens:", error); if (domElements.calculateLoadingMsg) domElements.calculateLoadingMsg.textContent = 'Erro.'; ui.showStatusMessage(elements.calculateStatus, `Erro: ${error.message || 'Verifique console.'}`, "error"); }
}
function renderCalculateItemList(items) {
    const container = domElements.calculateItemList; if (!container) return; container.innerHTML = ''; if (!items || items.length === 0) { return; }
    items.forEach(item => { /* ... (código do card igual ao anterior) ... */
        const card = document.createElement('div'); card.className = 'item-card'; const infoDiv = document.createElement('div'); infoDiv.className = 'item-card-info'; const nameH3 = document.createElement('h3'); nameH3.className = 'item-card-name'; nameH3.textContent = item.name; const detailsP = document.createElement('p'); detailsP.className = 'item-card-details'; const npcPriceFormatted = ui.formatCurrency ? ui.formatCurrency(item.npc_sell_price || 0) : (item.npc_sell_price || 0); detailsP.textContent = `Preço NPC (Pack): ${npcPriceFormatted}`; infoDiv.appendChild(nameH3); infoDiv.appendChild(detailsP); const actionsDiv = document.createElement('div'); actionsDiv.className = 'item-card-actions'; const calcButton = document.createElement('button'); calcButton.textContent = 'Calcular Lucro'; calcButton.className = 'button button-primary'; calcButton.dataset.id = item.id; calcButton.addEventListener('click', (e) => { const button = e.target; const originalText = button.textContent; button.textContent = 'Carregando...'; button.disabled = true; prepareAndOpenCalculateModal(item.id).finally(() => { button.textContent = originalText; button.disabled = false; }); }); actionsDiv.appendChild(calcButton); card.appendChild(infoDiv); card.appendChild(actionsDiv); container.appendChild(card);
    });
}
async function prepareAndOpenCalculateModal(itemId) {
    ui.showStatusMessage(elements.calculateStatus, `Buscando detalhes ID: ${itemId}...`, 'loading');
    try {
        const recipeData = await api.fetchRecipe(itemId);
        if (recipeData) { currentRecipeData = recipeData; openCalculationModal(); ui.hideStatusMessage(elements.calculateStatus); }
        else { ui.showStatusMessage(elements.calculateStatus, `Item ID: ${itemId} não encontrado.`, "error"); }
    } catch (error) { console.error("Erro ao buscar receita:", error); ui.showStatusMessage(elements.calculateStatus, `Erro: ${error.message || 'Erro desconhecido.'}`, "error"); }
}


/**
 * Adiciona um par de inputs de Preço/Quantidade para um material no modal.
 * (Função sem modificação aqui)
 */
function addPriceQtyPair(container, materialName, isFirstPair = false) {
    const liParent = container.closest('li'); const pairDiv = document.createElement('div'); pairDiv.className = 'price-qty-pair';
    const priceInput = document.createElement('input'); priceInput.type = 'number'; priceInput.className = 'market-price-input'; priceInput.placeholder = 'Preço'; priceInput.min = '0'; priceInput.value = '0'; priceInput.dataset.materialName = materialName;
    const qtyInput = document.createElement('input'); qtyInput.type = 'number'; qtyInput.className = 'market-qty-input'; qtyInput.placeholder = 'Qtd'; qtyInput.min = '1'; qtyInput.value = '1'; qtyInput.dataset.materialName = materialName;
    pairDiv.appendChild(priceInput); pairDiv.appendChild(qtyInput);
    if (!isFirstPair) {
        const removePairButton = document.createElement('button'); removePairButton.type = 'button'; removePairButton.textContent = 'X'; removePairButton.className = 'button button-danger remove-pair-button'; removePairButton.title = 'Remover este par';
        removePairButton.addEventListener('click', () => { const liForValidation = removePairButton.closest('li'); pairDiv.remove(); if (liForValidation) validateAndUpdateLotInputs(liForValidation); });
        pairDiv.appendChild(removePairButton);
    }
    container.appendChild(pairDiv); if (liParent) validateAndUpdateLotInputs(liParent);
}


/**
 * Abre e preenche o modal de cálculo.
 * MODIFICADO: Adiciona botão "+ Custo" e área oculta para itens de profissão.
 */
function openCalculationModal() {
    if (!currentRecipeData) { ui.showStatusMessage(elements.calculateStatus, "Dados da receita não disponíveis.", "error"); return; }
    domElements.modalItemNameSpan.textContent = currentRecipeData.name;
    domElements.modalCraftQuantityInput.value = 1;
    domElements.modalMaterialsList.innerHTML = '';

    currentRecipeData.materials.forEach(mat => {
        const li = document.createElement('li');
        li.dataset.materialName = mat.material_name;
        li.dataset.baseQuantity = mat.quantity;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'material-name-display material-quantity-display';
        nameSpan.textContent = `...x ${mat.material_name}`; // Placeholder
        li.appendChild(nameSpan); // Adiciona o span principal

        // *** MUDANÇA: Lógica diferente para profissão ***
        if (mat.material_type === 'profession') {
            nameSpan.textContent += ` (Profissão)`; // Atualiza o texto do span principal

            // Botão para mostrar/esconder área de custo
            const toggleCostButton = document.createElement('button');
            toggleCostButton.type = 'button';
            toggleCostButton.textContent = '+ Custo';
            toggleCostButton.className = 'button button-secondary button-xsmall add-prof-cost-button'; // Usar classe CSS
            toggleCostButton.title = 'Adicionar custo unitário para este item';
            li.appendChild(toggleCostButton); // Adiciona o botão ao lado do span

            // Container para o input de custo (começa oculto)
            const costArea = document.createElement('div');
            costArea.className = 'profession-cost-area'; // Classe para CSS
            costArea.style.display = 'none'; // Começa oculto

            const costLabel = document.createElement('label');
            costLabel.textContent = 'Custo Unitário:';
            const inputId = `prof-cost-${mat.material_name.replace(/\s+/g, '-')}-${Date.now()}`; // ID único
            costLabel.htmlFor = inputId;

            const costInput = document.createElement('input');
            costInput.type = 'number';
            costInput.min = '0';
            costInput.value = '0';
            costInput.className = 'profession-cost-input'; // Classe para coletar valor
            costInput.dataset.materialName = mat.material_name; // Linkar ao material
            costInput.id = inputId;
            costInput.placeholder = '0';

            costArea.appendChild(costLabel);
            costArea.appendChild(costInput);
            li.appendChild(costArea); // Adiciona a área oculta ao li

            // Event listener para o botão toggle
            toggleCostButton.addEventListener('click', () => {
                const isHidden = costArea.style.display === 'none';
                if (isHidden) {
                    costArea.style.display = 'flex'; // Mostra (usando flex definido no CSS)
                    toggleCostButton.textContent = '- Custo';
                    toggleCostButton.title = 'Remover custo unitário';
                } else {
                    costArea.style.display = 'none'; // Esconde
                    toggleCostButton.textContent = '+ Custo';
                     toggleCostButton.title = 'Adicionar custo unitário para este item';
                    costInput.value = '0'; // Reseta o valor ao esconder
                }
            });

        } else { // Lógica para 'drop' ou 'buy' (igual anterior)
            const npcPriceFormatted = calculator.formatCurrency(mat.default_npc_price || 0);
            const npcRefSpan = document.createElement('span'); npcRefSpan.className = 'material-npc-ref'; npcRefSpan.textContent = ` (NPC Ref: ${npcPriceFormatted})`; li.appendChild(npcRefSpan);
            const pairsContainer = document.createElement('div'); pairsContainer.className = 'price-qty-pairs-container'; li.appendChild(pairsContainer); addPriceQtyPair(pairsContainer, mat.material_name, true);
            const addPairButton = document.createElement('button'); addPairButton.type = 'button'; addPairButton.textContent = '+ Lote'; addPairButton.className = 'button button-secondary add-pair-button'; addPairButton.title = 'Adicionar lote';
            addPairButton.addEventListener('click', () => { addPriceQtyPair(pairsContainer, mat.material_name, false); }); li.appendChild(addPairButton);
        }
        domElements.modalMaterialsList.appendChild(li);
    });

    domElements.modalSellPriceNpcBaseSpan.textContent = calculator.formatCurrency(currentRecipeData.npc_sell_price || 0);
    domElements.modalSellPriceMarketInput.value = '0';
    updateDynamicModalValues(); // Define valores iniciais e validação
    domElements.modalResultsDiv.style.display = 'none';
    ui.hideStatusMessage(elements.modalStatus);
    domElements.calculationModal.style.display = 'flex';
}


function closeCalculationModal() {
    if (domElements.calculationModal) { domElements.calculationModal.style.display = 'none'; }
    currentRecipeData = null;
}


// --- updateDynamicModalValues (sem mudanças aqui) ---
function updateDynamicModalValues() {
    if (!currentRecipeData || !domElements.modalCraftQuantityInput || !domElements.modalTotalItemsLabel || !domElements.modalSellPriceNpcTotalSpan || !domElements.modalCalcPacksLabelNpc || !domElements.modalMaterialsList) { console.warn("[updateDynamicModalValues] Elementos/Dados ausentes."); return; }
    const desiredPacks = parseInt(domElements.modalCraftQuantityInput.value, 10) || 0;
    const baseQuantityProduced = currentRecipeData.quantity_produced || 1;
    const totalItems = desiredPacks * baseQuantityProduced;
    const totalNpcPrice = (currentRecipeData.npc_sell_price || 0) * desiredPacks;
    domElements.modalTotalItemsLabel.textContent = calculator.formatCurrency(totalItems);
    domElements.modalCalcPacksLabelNpc.textContent = desiredPacks;
    domElements.modalSellPriceNpcTotalSpan.textContent = calculator.formatCurrency(totalNpcPrice);
    if(domElements.modalCalcPacksLabelResults) { domElements.modalCalcPacksLabelResults.textContent = desiredPacks; }
    try {
        domElements.modalMaterialsList.querySelectorAll('li').forEach(li => {
            const nameSpan = li.querySelector('.material-quantity-display');
            const baseQuantityMaterial = parseInt(li.dataset.baseQuantity, 10);
            const materialName = li.dataset.materialName;
            const recipeMaterial = currentRecipeData.materials.find(m => m.material_name === materialName);
            if (nameSpan && !isNaN(baseQuantityMaterial) && materialName && recipeMaterial) {
                const newTotalQuantity = baseQuantityMaterial * desiredPacks;
                li.dataset.totalNeeded = newTotalQuantity; // Guarda total para validação de lotes
                const formattedQuantity = calculator.formatCurrency(newTotalQuantity);
                let textContent = `${formattedQuantity}x ${materialName}`;
                if (recipeMaterial.material_type === 'profession') { textContent += ` (Profissão)`; }
                nameSpan.textContent = textContent;
                // Valida lotes (drop/buy) ou limpa estilos (profession)
                if (recipeMaterial.material_type !== 'profession') {
                    validateAndUpdateLotInputs(li);
                } else {
                    // Garante que inputs de profissão não tenham estilo de validação de lote
                     const profCostInput = li.querySelector('.profession-cost-input');
                     if(profCostInput) profCostInput.classList.remove('input-valid', 'input-invalid', 'input-warning');
                }
            } else { console.warn(`[updateDynamicModalValues] Falha ao atualizar: ${materialName || 'desconhecido'}.`); }
        });
    } catch (error) { console.error("[updateDynamicModalValues] Erro ao atualizar materiais/validação:", error); }
}


/**
 * Lida com a confirmação do cálculo no modal.
 * MODIFICADO: Coleta custos de profissão dos inputs visíveis.
 */
function handleModalConfirm() {
    if (!currentRecipeData) return;
    ui.showStatusMessage(elements.modalStatus, "Validando e Calculando...", "loading");
    const desiredPacks = parseInt(domElements.modalCraftQuantityInput.value, 10);
    if (isNaN(desiredPacks) || desiredPacks <= 0) { ui.showStatusMessage(elements.modalStatus, "Quantidade de Packs inválida.", "error"); return; }

    let isOverallValid = true;
    const marketPricesMaterialsAvg = {};
    const materialListItems = domElements.modalMaterialsList.querySelectorAll('li');

    // Validação final de lotes (drop/buy)
    for (const li of materialListItems) {
        const materialName = li.dataset.materialName;
        const recipeMaterial = currentRecipeData.materials.find(m => m.material_name === materialName);
        if (recipeMaterial && (recipeMaterial.material_type === 'drop' || recipeMaterial.material_type === 'buy')) {
            const isMaterialInvalid = li.querySelector('.market-qty-input.input-invalid') !== null;
            if (isMaterialInvalid) {
                 const totalNeeded = calculator.formatCurrency(parseInt(li.dataset.totalNeeded || 0, 10)); let currentSum = 0; li.querySelectorAll('.market-qty-input').forEach(input => { currentSum += parseInt(input.value, 10) || 0; }); const formattedSum = calculator.formatCurrency(currentSum);
                 const errorMsg = `Erro: Quantidade do lote para '${materialName}' (${formattedSum}) excede o necessário (${totalNeeded}). Ajuste os campos em vermelho.`;
                 ui.showStatusMessage(elements.modalStatus, errorMsg, "error"); isOverallValid = false; break;
            }
        }
        // Não há validação extra necessária para custo de profissão aqui (aceita qualquer valor >= 0)
    }
    if (!isOverallValid) { console.warn("[handleModalConfirm] Validação final falhou."); return; }

    // *** MUDANÇA: Coleta de custos de profissão ***
    const professionCosts = {};
    materialListItems.forEach(li => {
        const profCostInput = li.querySelector('.profession-cost-input');
        // Considera o custo apenas se o input existir e estiver visível (pai não está display:none)
        if (profCostInput && profCostInput.closest('.profession-cost-area')?.style.display !== 'none') {
            const materialName = profCostInput.dataset.materialName;
            const cost = parseFloat(profCostInput.value);
            if (materialName && !isNaN(cost) && cost >= 0) {
                professionCosts[materialName] = cost;
            }
        }
    });
    console.log("[handleModalConfirm] Custos de profissão coletados:", professionCosts);
    // *** FIM da coleta de custos ***


    // Cálculo do Preço Médio para drop/buy (igual anterior)
    let calculationError = false;
    materialListItems.forEach(li => { /* ... (lógica de cálculo da média igual anterior) ... */
        const materialName = li.dataset.materialName; const recipeMaterial = currentRecipeData.materials.find(m => m.material_name === materialName);
        if (recipeMaterial && (recipeMaterial.material_type === 'drop' || recipeMaterial.material_type === 'buy')) {
            const pairsContainer = li.querySelector('.price-qty-pairs-container'); if (!pairsContainer) { console.error(`Container de pares não encontrado para ${materialName}`); calculationError = true; return; }
            const pairs = pairsContainer.querySelectorAll('.price-qty-pair'); let totalCostForMaterial = 0; let totalQtyForMaterial = 0;
            pairs.forEach(pair => {
                const priceInput = pair.querySelector('.market-price-input'); const qtyInput = pair.querySelector('.market-qty-input');
                const price = parseFloat(priceInput?.value) || 0; const qty = parseInt(qtyInput?.value, 10) || 0;
                if (qty > 0 && price >= 0) { totalCostForMaterial += price * qty; totalQtyForMaterial += qty; }
            });
            const avgPrice = (totalQtyForMaterial > 0) ? totalCostForMaterial / totalQtyForMaterial : 0; marketPricesMaterialsAvg[materialName] = avgPrice;
        }
    });
    if (calculationError) { ui.showStatusMessage(elements.modalStatus, "Erro ao processar dados dos lotes.", "error"); return; }

    // Leitura Preço Venda (igual anterior)
    const marketSellPricePerPack = parseFloat(domElements.modalSellPriceMarketInput.value);
    if (isNaN(marketSellPricePerPack) || marketSellPricePerPack < 0) { ui.showStatusMessage(elements.modalStatus, "Preço de venda inválido.", "error"); return; }

    // Chamar Funções de Cálculo
    try {
        // *** MUDANÇA: Passa os custos de profissão coletados para a função ***
        const totalCost = calculator.calculateCraftingCost(currentRecipeData, marketPricesMaterialsAvg, desiredPacks, professionCosts);

        const totalMarketRevenue = marketSellPricePerPack * desiredPacks; const sellPricesForCalc = { market: totalMarketRevenue };
        const profitResults = calculator.calculateProfit(totalCost, currentRecipeData, sellPricesForCalc, desiredPacks);

        displayModalResults(totalCost, profitResults, desiredPacks);
        ui.hideStatusMessage(elements.modalStatus);
    } catch (error) {
        console.error("Erro durante cálculo final:", error); ui.showStatusMessage(elements.modalStatus, `Erro no cálculo: ${error.message || 'Erro desconhecido.'}`, "error");
        if (domElements.modalResultsDiv) domElements.modalResultsDiv.style.display = 'none';
    }
}


// --- displayModalResults (sem mudanças aqui) ---
function displayModalResults(cost, profits, packsCalculated) {
    if (domElements.modalCalcPacksLabelResults) domElements.modalCalcPacksLabelResults.textContent = packsCalculated;
    domElements.modalResultCost.textContent = calculator.formatCurrency(cost);
    domElements.modalResultRevenueMarket.textContent = calculator.formatCurrency(profits.totalRevenueMarket);
    domElements.modalResultRevenueNpc.textContent = calculator.formatCurrency(profits.totalRevenueNPC);
    domElements.modalResultProfitMarket.textContent = calculator.formatCurrency(profits.profitMarket);
    domElements.modalResultProfitNpc.textContent = calculator.formatCurrency(profits.profitNPC);
    const compensaMarket = domElements.modalCompensaMarket; const compensaNpc = domElements.modalCompensaNpc;
    if (compensaMarket) { compensaMarket.textContent = profits.profitMarket > 0 ? '(Compensa)' : profits.profitMarket < 0 ? '(Não Compensa)' : '(Neutro)'; compensaMarket.style.color = profits.profitMarket >= 0 ? 'var(--color-success)' : 'var(--color-danger)'; }
    if (compensaNpc) { compensaNpc.textContent = profits.profitNPC > 0 ? '(Compensa)' : profits.profitNPC < 0 ? '(Não Compensa)' : '(Neutro)'; compensaNpc.style.color = profits.profitNPC >= 0 ? 'var(--color-success)' : 'var(--color-danger)'; }
    const percentageSpan = domElements.modalProfitPercentageMarket;
    if (percentageSpan) {
        let marketProfitPercentageText = '- %'; let percentageColor = 'inherit';
        if (cost > 0) { const marketProfitPercentage = (profits.profitMarket / cost) * 100; marketProfitPercentageText = `(${marketProfitPercentage.toFixed(1)}%)`; percentageColor = profits.profitMarket >= 0 ? 'var(--color-success)' : 'var(--color-danger)'; }
        else if (profits.profitMarket > 0) { marketProfitPercentageText = '(∞%)'; percentageColor = 'var(--color-success)'; }
        percentageSpan.textContent = marketProfitPercentageText; percentageSpan.style.color = percentageColor;
    }
    const profMatLine = domElements.modalProfitPerProfMatLine; const profMatValueSpan = domElements.modalProfitPerProfMatValue;
    const firstProfessionMat = currentRecipeData?.materials?.find(mat => mat.material_type === 'profession');
    if (profMatLine && profMatValueSpan && firstProfessionMat && packsCalculated > 0) {
        const profMatQuantityPerPack = firstProfessionMat.quantity || 0; const totalProfessionMats = profMatQuantityPerPack * packsCalculated;
        let profitPerMatText = "N/A"; let profitPerMatColor = 'inherit';
        const nameSpan = profMatLine.querySelector(elements.profMatNameSpan); if(nameSpan) nameSpan.textContent = firstProfessionMat.material_name;
        if (totalProfessionMats > 0) { const profitPerMatValue = profits.profitMarket / totalProfessionMats; profitPerMatText = profitPerMatValue.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); profitPerMatColor = profits.profitMarket >= 0 ? 'var(--color-success)' : 'var(--color-danger)'; }
        profMatValueSpan.textContent = profitPerMatText; profMatValueSpan.style.color = profitPerMatColor; profMatLine.style.display = 'block';
    } else if (profMatLine) { profMatLine.style.display = 'none'; }
    if (domElements.modalResultsDiv) domElements.modalResultsDiv.style.display = 'block';
}