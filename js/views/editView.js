// craftraito/frontend/js/views/editView.js
// CORRIGIDO: Removida a chave 'editModalContent' do objeto elements para evitar erro.
// REESTRUTURADO: Edição agora ocorre em um modal.
// Funções show/hideEditForm substituídas por open/hideEditModal.
// Seletores e listeners ajustados para elementos dentro do modal.
import * as api from '../apiService.js';
import * as ui from '../ui.js';

// IDs dos elementos DOM (Atualizados para o modal)
const elements = {
    editListContainer: 'edit-item-list',         // Container dos cards na página principal
    editLoadingMsg: 'edit-loading-message',      // Mensagem de loading na página principal
    editStatus: 'edit-status',                   // Status na página principal (para delete/update geral)

    editItemModal: 'edit-item-modal',            // O modal de edição em si
    // editModalContent: '.modal-content',       // <<< REMOVIDO: Não é um ID e não é essencial buscar diretamente
    editModalCloseButton: 'edit-modal-close-button', // Botão 'X' do modal
    editModalForm: 'edit-modal-form',            // O formulário DENTRO do modal
    editModalTitleSpan: 'edit-modal-item-title-name', // Span para o título do item no modal
    editModalItemIdInput: 'edit-modal-item-id',      // Input hidden ID dentro do modal
    editModalMaterialsContainer: 'edit-modal-materials-container', // Container de materiais DENTRO do modal
    editModalAddMaterialButton: 'edit-modal-add-material-button', // Botão Adicionar Material DENTRO do modal
    editModalCancelButton: 'edit-modal-cancel-button',   // Botão Cancelar DENTRO do modal
    editModalStatus: 'edit-modal-status'         // Status DENTRO do modal
};

// Mapeamento dos elementos do DOM (será preenchido em init)
let domElements = {};

/**
 * Inicializa a view de edição (lista de itens) e configura listeners para o modal.
 */
export function initEditView() {
    console.log("Inicializando Edit View (com Modal)...");
    // Limpa o objeto domElements para garantir que não haja referências antigas
    domElements = {};

    // Mapeia elementos da página e do modal usando os IDs definidos em 'elements'
    for (const key in elements) {
        domElements[key] = document.getElementById(elements[key]);
    }

    // Verifica elementos essenciais APÓS tentar buscar todos
    const essentialKeys = Object.keys(elements); // Pega todas as chaves definidas
    const missingKey = essentialKeys.find(key => !domElements[key]); // Verifica se algum elemento não foi encontrado
    if (missingKey) {
        // Se algo essencial não foi encontrado, loga o ID que falhou
        console.error(`Elemento essencial não encontrado com ID: #${elements[missingKey]}`);
        // Tenta mostrar status no elemento de status principal ou global
        const statusElementId = elements.editStatus || 'global-status-message';
        ui.showStatusMessage(statusElementId, "Erro: Falha ao carregar UI de edição.", "error");
        return; // Interrompe a inicialização
    }
    console.log("Todos elementos essenciais da Edit View encontrados.");


    // Limpa event listeners antigos do MODAL (importante!)
    // Clona e substitui para remover listeners antigos de forma segura
    domElements.editModalForm = domElements.editModalForm.cloneNode(true);
    domElements.editModalAddMaterialButton = domElements.editModalAddMaterialButton.cloneNode(true);
    domElements.editModalCancelButton = domElements.editModalCancelButton.cloneNode(true);
    domElements.editModalCloseButton = domElements.editModalCloseButton.cloneNode(true);

    // Re-busca referências dos elementos clonados do MODAL
    // (Necessário porque a clonagem cria novos nós no DOM)
    domElements.editModalForm = document.getElementById(elements.editModalForm);
    domElements.editModalAddMaterialButton = document.getElementById(elements.editModalAddMaterialButton);
    domElements.editModalCancelButton = document.getElementById(elements.editModalCancelButton);
    domElements.editModalCloseButton = document.getElementById(elements.editModalCloseButton);


    // Configura Listeners DO MODAL
    if(domElements.editModalForm) {
        domElements.editModalForm.addEventListener('submit', handleEditSubmit);
    }
    if(domElements.editModalAddMaterialButton) {
        domElements.editModalAddMaterialButton.addEventListener('click', () => {
            ui.addMaterialInput(domElements.editModalMaterialsContainer);
        });
    }
    if(domElements.editModalCancelButton) {
        domElements.editModalCancelButton.addEventListener('click', hideEditModal);
    }
    if(domElements.editModalCloseButton) {
        domElements.editModalCloseButton.addEventListener('click', hideEditModal);
    }


    // Carrega a lista de itens para a PÁGINA principal
    loadItemsForEditing();

    // Esconde o modal inicialmente (garantia extra)
    hideEditModal();
}

// --- loadItemsForEditing, renderEditList, startEdit ---
// --- (Sem mudanças significativas aqui, exceto logs de debug já presentes) ---
async function loadItemsForEditing() {
    if (domElements.editLoadingMsg) domElements.editLoadingMsg.style.display = 'block';
    if (domElements.editListContainer) domElements.editListContainer.innerHTML = '';
    hideEditModal();
    if(domElements.editStatus) ui.hideStatusMessage(elements.editStatus);

    try {
        const items = await api.fetchItems();
        renderEditList(items);
        if (domElements.editLoadingMsg) domElements.editLoadingMsg.style.display = 'none';
        if (items.length === 0) {
             if(domElements.editStatus) ui.showStatusMessage(elements.editStatus, "Nenhum item registrado ainda.", "info");
        }
    } catch (error) {
        console.error("Erro ao carregar itens para edição:", error);
        if (domElements.editLoadingMsg) domElements.editLoadingMsg.textContent = 'Erro ao carregar itens.';
        if(domElements.editStatus) ui.showStatusMessage(elements.editStatus, `Erro ao carregar itens: ${error.message || 'Verifique o console.'}`, "error");
    }
}
function renderEditList(items) {
    const container = domElements.editListContainer;
    if (!container) return;
    container.innerHTML = '';
    if (!items || items.length === 0) return;

    items.forEach(item => {
        const card = document.createElement('div'); card.className = 'item-card';
        const infoDiv = document.createElement('div'); infoDiv.className = 'item-card-info';
        const nameH3 = document.createElement('h3'); nameH3.className = 'item-card-name'; nameH3.textContent = item.name;
        const detailsP = document.createElement('p'); detailsP.className = 'item-card-details';
        const npcPriceFormatted = ui.formatCurrency ? ui.formatCurrency(item.npc_sell_price || 0) : item.npc_sell_price || 0;
        detailsP.textContent = `Preço NPC (Pack): ${npcPriceFormatted}`;
        infoDiv.appendChild(nameH3); infoDiv.appendChild(detailsP);
        const actionsDiv = document.createElement('div'); actionsDiv.className = 'item-card-actions';
        const editButton = document.createElement('button'); editButton.textContent = 'Editar'; editButton.className = 'button button-secondary edit-button'; editButton.dataset.id = item.id;
        editButton.addEventListener('click', (e) => {
            const btn = e.target; const originalText = btn.textContent; btn.textContent = 'Abrindo...'; btn.disabled = true;
            startEdit(item.id).finally(() => { btn.textContent = originalText; btn.disabled = false; });
        });
        const deleteButton = document.createElement('button'); deleteButton.textContent = 'Deletar'; deleteButton.className = 'button button-danger delete-button'; deleteButton.dataset.id = item.id; deleteButton.dataset.name = item.name;
        deleteButton.addEventListener('click', (e) => handleDelete(e.target.dataset.id, e.target.dataset.name));
        actionsDiv.appendChild(editButton); actionsDiv.appendChild(deleteButton);
        card.appendChild(infoDiv); card.appendChild(actionsDiv); container.appendChild(card);
    });
}
async function startEdit(itemId) {
    // Usa o status DENTRO do modal para loading
    if(domElements.editModalStatus) ui.showStatusMessage(elements.editModalStatus, "Carregando dados...", "loading");
    else console.warn("Elemento de status do modal não encontrado para loading.");

    try {
        const recipeData = await api.fetchRecipe(itemId);
        console.log("[DEBUG] Dados recebidos da API (fetchRecipe):", recipeData);
        if (!recipeData) {
             if(domElements.editStatus) ui.showStatusMessage(elements.editStatus, `Item ID ${itemId} não encontrado.`, "error");
             if(domElements.editModalStatus) ui.hideStatusMessage(elements.editModalStatus);
             return;
        }
        populateEditModal(recipeData);
        openEditModal();
        if(domElements.editModalStatus) ui.hideStatusMessage(elements.editModalStatus);
    } catch (error) {
        console.error(`Erro ao buscar item ${itemId} para edição:`, error);
        if(domElements.editModalStatus) ui.showStatusMessage(elements.editModalStatus, `Erro ao carregar dados: ${error.message || 'Erro.'}`, "error");
        else if(domElements.editStatus) ui.showStatusMessage(elements.editStatus, `Erro ao carregar dados para ID ${itemId}.`, "error");
    }
}


/**
 * Preenche o formulário DENTRO DO MODAL com os dados da receita.
 */
function populateEditModal(recipeData) {
    if (!domElements.editModalForm) {
        console.error("Formulário do modal de edição não encontrado para preencher.");
        return;
    }
    domElements.editModalTitleSpan.textContent = recipeData.name;
    domElements.editModalItemIdInput.value = recipeData.id;
    // Assume-se que os inputs existem dentro do form já encontrado
    domElements.editModalForm.querySelector('#edit-modal-name').value = recipeData.name;
    domElements.editModalForm.querySelector('#edit-modal-quantity').value = recipeData.quantity_produced;
    domElements.editModalForm.querySelector('#edit-modal-npc-sell-price').value = recipeData.npc_sell_price || 0;

    domElements.editModalMaterialsContainer.innerHTML = '';

    console.log("[DEBUG] Tentando popular materiais no modal:", recipeData.materials);
    if (recipeData.materials && recipeData.materials.length > 0) {
        recipeData.materials.forEach((mat, index) => {
            console.log(`[DEBUG] Adicionando material ${index + 1} ao modal:`, mat);
            ui.addMaterialInput(domElements.editModalMaterialsContainer, mat);
        });
    }
}

/**
 * Abre o modal de edição.
 */
function openEditModal() {
    if (domElements.editItemModal) {
        domElements.editItemModal.style.display = 'flex';
    } else {
        console.error("Elemento do modal de edição não encontrado para abrir.");
    }
}

/**
 * Esconde e reseta o modal de edição.
 */
function hideEditModal() {
    if (domElements.editItemModal) {
        domElements.editItemModal.style.display = 'none';
    }
    // Reseta apenas se os elementos existirem
    if (domElements.editModalForm) domElements.editModalForm.reset();
    if (domElements.editModalMaterialsContainer) domElements.editModalMaterialsContainer.innerHTML = '';
    if (domElements.editModalItemIdInput) domElements.editModalItemIdInput.value = '';
    if (domElements.editModalStatus) ui.hideStatusMessage(elements.editModalStatus);
}

/**
 * Lida com a submissão do formulário de edição (DO MODAL).
 */
async function handleEditSubmit(event) {
    event.preventDefault();
    if (!domElements.editModalForm || !domElements.editModalItemIdInput || !domElements.editModalStatus || !domElements.editModalMaterialsContainer || !domElements.editStatus) {
         console.error("Elementos faltando para handleEditSubmit"); return;
    }

    const itemId = domElements.editModalItemIdInput.value;
    if (!itemId) {
        ui.showStatusMessage(elements.editModalStatus, "Erro: ID do item não encontrado.", "error");
        return;
    }

    ui.showStatusMessage(elements.editModalStatus, "Salvando alterações...", "loading");

    const formData = new FormData(domElements.editModalForm);
    const materials = ui.getMaterialsData(domElements.editModalMaterialsContainer);

    if (materials === null) {
        ui.showStatusMessage(elements.editModalStatus, 'Erro: Verifique os dados dos materiais.', 'error');
        return;
    }

    const updatedData = {
        name: formData.get('name')?.trim(),
        quantity_produced: parseInt(formData.get('quantity_produced'), 10),
        npc_sell_price: parseInt(formData.get('npc_sell_price'), 10) || 0,
        materials: materials
    };

    if (!updatedData.name || !updatedData.quantity_produced || updatedData.quantity_produced <= 0) {
        ui.showStatusMessage(elements.editModalStatus, 'Erro: Nome e Quantidade (> 0) são obrigatórios.', 'error');
        return;
    }
    if (updatedData.materials.length === 0) {
         ui.showStatusMessage(elements.editModalStatus, 'Erro: Adicione pelo menos um material.', 'error');
         return;
    }

    try {
        await api.updateItem(itemId, updatedData);
        hideEditModal();
        ui.showStatusMessage(elements.editStatus, `Item "${updatedData.name}" atualizado!`, "success");
        loadItemsForEditing(); // Recarrega lista principal
    } catch (error) {
        console.error(`Erro ao atualizar item ${itemId}:`, error);
        ui.showStatusMessage(elements.editModalStatus, `Erro ao salvar: ${error.message || 'Erro.'}`, "error");
    }
}

/**
 * Lida com a deleção de um item.
 */
async function handleDelete(itemId, itemName) {
     if (!domElements.editStatus || !domElements.editModalItemIdInput) {
         console.error("Elementos faltando para handleDelete"); return;
     }
    if (!confirm(`Tem certeza que deseja deletar o item "${itemName}"?`)) {
        return;
    }

    ui.showStatusMessage(elements.editStatus, `Deletando "${itemName}"...`, "loading");

    try {
        await api.deleteItem(itemId);
        ui.showStatusMessage(elements.editStatus, `Item "${itemName}" deletado!`, "success");
        // Se o modal estivesse aberto para este item, feche-o
        if (domElements.editModalItemIdInput.value === String(itemId)) { // Compara como string se necessário
             hideEditModal();
        }
        loadItemsForEditing();
    } catch (error) {
        console.error(`Erro ao deletar item ${itemId}:`, error);
        ui.showStatusMessage(elements.editStatus, `Erro ao deletar: ${error.message || 'Erro.'}`, "error");
    }
}