import * as api from '../apiService.js';
import * as ui from '../ui.js';

// IDs dos elementos DOM
const elements = {
    editListContainer: 'edit-item-list', // Container dos cards
    editLoadingMsg: 'edit-loading-message', // Mensagem de loading inicial
    editFormContainer: 'edit-form-container',
    editForm: 'edit-form',
    editMaterialsContainer: 'edit-materials-container',
    editItemIdInput: 'edit-item-id',
    editItemTitleSpan: 'edit-item-title-name',
    editAddMaterialButton: 'edit-add-material-button',
    editCancelButton: 'edit-cancel-button',
    editStatus: 'edit-status',
    editFormStatus: 'edit-form-status'
};

let domElements = {};
let itemsCache = []; // Cache simples

/**
 * Inicializa a view de edição.
 */
export function initEditView() {
    console.log("Inicializando Edit View...");
    domElements = Object.keys(elements).reduce((acc, key) => {
        acc[key] = document.getElementById(elements[key]);
        return acc;
    }, {});

    // Verifica elementos essenciais
    const essentialElements = [
        'editListContainer', 'editLoadingMsg', 'editFormContainer', 'editForm',
        'editMaterialsContainer', 'editItemIdInput', 'editItemTitleSpan',
        'editAddMaterialButton', 'editCancelButton'
    ];
    const missingElement = essentialElements.find(key => !domElements[key]);
    if (missingElement) {
        console.error(`Elemento essencial não encontrado: #${elements[missingElement]}`);
        ui.showStatusMessage(elements.editStatus, "Erro: Falha ao carregar componentes da interface de edição.", "error");
        return;
    }

    // Limpa event listeners antigos (boa prática)
    domElements.editForm.replaceWith(domElements.editForm.cloneNode(true));
    domElements.editAddMaterialButton.replaceWith(domElements.editAddMaterialButton.cloneNode(true));
    domElements.editCancelButton.replaceWith(domElements.editCancelButton.cloneNode(true));
     // Re-busca referências após clonar
    domElements.editForm = document.getElementById(elements.editForm);
    domElements.editAddMaterialButton = document.getElementById(elements.editAddMaterialButton);
    domElements.editCancelButton = document.getElementById(elements.editCancelButton);


    // Configura Listeners
    domElements.editForm.addEventListener('submit', handleEditSubmit);
    domElements.editAddMaterialButton.addEventListener('click', () => ui.addMaterialInput(domElements.editMaterialsContainer));
    domElements.editCancelButton.addEventListener('click', cancelEdit);

    // Carrega a lista de itens ao inicializar
    loadItemsForEditing();
}

/**
 * Carrega ou recarrega a lista de itens para edição e renderiza os cards.
 */
async function loadItemsForEditing() {
    // Mostra mensagem de loading, esconde form e limpa lista antiga
    if (domElements.editLoadingMsg) domElements.editLoadingMsg.style.display = 'block';
    if (domElements.editListContainer) domElements.editListContainer.innerHTML = '';
    hideEditForm();
    ui.hideStatusMessage(elements.editStatus);

    try {
        itemsCache = await api.fetchItems(); // Atualiza o cache
        renderEditList(itemsCache); // Renderiza os cards
        if (domElements.editLoadingMsg) domElements.editLoadingMsg.style.display = 'none'; // Esconde loading
        if (itemsCache.length === 0) {
             ui.showStatusMessage(elements.editStatus, "Nenhum item registrado ainda.", "info");
        }
    } catch (error) {
        console.error("Erro ao carregar itens para edição:", error);
         if (domElements.editLoadingMsg) domElements.editLoadingMsg.textContent = 'Erro ao carregar itens.';
        ui.showStatusMessage(elements.editStatus, `Erro ao carregar itens: ${error.message || 'Verifique o console e o backend.'}`, "error");
    }
}

/**
 * Renderiza os cards de item na página de edição.
 * @param {Array} items - Array de itens a serem renderizados.
 */
function renderEditList(items) {
    const container = domElements.editListContainer;
    if (!container) return;
    container.innerHTML = ''; // Limpa

    if (!items || items.length === 0) {
        // A mensagem de "nenhum item" é mostrada pelo loadItemsForEditing
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card'; // Usa a mesma classe de card

        const infoDiv = document.createElement('div');
        infoDiv.className = 'item-card-info';

        const nameH3 = document.createElement('h3');
        nameH3.className = 'item-card-name';
        nameH3.textContent = item.name;

        const detailsP = document.createElement('p');
        detailsP.className = 'item-card-details';
        const npcPriceFormatted = ui.formatCurrency ? ui.formatCurrency(item.npc_sell_price || 0) : item.npc_sell_price || 0;
        detailsP.textContent = `Preço NPC (Pack): ${npcPriceFormatted}`;

        infoDiv.appendChild(nameH3);
        infoDiv.appendChild(detailsP);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'item-card-actions';

        // Botão Editar
        const editButton = document.createElement('button');
        editButton.textContent = 'Editar';
        editButton.className = 'button button-secondary edit-button'; // Adicionada classe 'edit-button' se necessário
        editButton.dataset.id = item.id;
        editButton.addEventListener('click', (e) => startEdit(e.target.dataset.id));

        // Botão Deletar
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Deletar';
        deleteButton.className = 'button button-danger delete-button'; // Adicionada classe 'delete-button' se necessário
        deleteButton.dataset.id = item.id;
        deleteButton.dataset.name = item.name; // Guarda nome para confirmação
        deleteButton.addEventListener('click', (e) => handleDelete(e.target.dataset.id, e.target.dataset.name));

        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);
        card.appendChild(infoDiv);
        card.appendChild(actionsDiv);
        container.appendChild(card);
    });
}

/**
 * Inicia o processo de edição de um item (busca dados e preenche form).
 * @param {string|number} itemId - ID do item a ser editado.
 */
async function startEdit(itemId) {
    ui.showStatusMessage(elements.editFormStatus, "Carregando dados para edição...", "loading");
    hideEditForm(); // Esconde form antigo

    try {
        const recipeData = await api.fetchRecipe(itemId);
        if (!recipeData) {
             ui.showStatusMessage(elements.editStatus, `Item ID ${itemId} não encontrado.`, "error");
             return;
        }
        populateEditForm(recipeData);
        showEditForm();
         ui.hideStatusMessage(elements.editFormStatus); // Esconde loading
         domElements.editFormContainer.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error(`Erro ao buscar item ${itemId} para edição:`, error);
        ui.showStatusMessage(elements.editFormStatus, `Erro ao carregar dados: ${error.message || 'Erro desconhecido.'}`, "error");
    }
}

/**
 * Preenche o formulário de edição com os dados da receita.
 */
function populateEditForm(recipeData) {
     domElements.editItemTitleSpan.textContent = recipeData.name;
    domElements.editItemIdInput.value = recipeData.id;
    domElements.editForm.querySelector('#edit-name').value = recipeData.name;
    domElements.editForm.querySelector('#edit-quantity').value = recipeData.quantity_produced;
    domElements.editForm.querySelector('#edit-npc-sell-price').value = recipeData.npc_sell_price || 0;

    domElements.editMaterialsContainer.innerHTML = '';
    if (recipeData.materials && recipeData.materials.length > 0) {
        recipeData.materials.forEach(mat => {
            ui.addMaterialInput(domElements.editMaterialsContainer, mat);
        });
    } else {
         ui.addMaterialInput(domElements.editMaterialsContainer);
    }
}

/**
 * Mostra o container do formulário de edição.
 */
function showEditForm() {
    domElements.editFormContainer.style.display = 'block';
}

/**
 * Esconde e reseta o formulário de edição.
 */
function hideEditForm() {
    domElements.editFormContainer.style.display = 'none';
    domElements.editForm.reset(); // Limpa os campos
    domElements.editMaterialsContainer.innerHTML = ''; // Limpa materiais
    domElements.editItemIdInput.value = ''; // Limpa ID escondido
     ui.hideStatusMessage(elements.editFormStatus); // Esconde status do form
}

/**
 * Cancela a edição e esconde o formulário.
 */
function cancelEdit() {
    hideEditForm(); // Já reseta dentro dela agora
}

/**
 * Lida com a submissão do formulário de edição.
 */
async function handleEditSubmit(event) {
    event.preventDefault();
    const itemId = domElements.editItemIdInput.value;
    if (!itemId) {
        ui.showStatusMessage(elements.editFormStatus, "Erro: ID do item não encontrado para salvar.", "error");
        return;
    }

    ui.showStatusMessage(elements.editFormStatus, "Salvando alterações...", "loading");

    const formData = new FormData(domElements.editForm);
    const materials = ui.getMaterialsData(domElements.editMaterialsContainer);

    if (materials === null) {
        ui.showStatusMessage(elements.editFormStatus, 'Erro: Verifique os dados dos materiais.', 'error');
        return;
    }

    const updatedData = {
        name: formData.get('name')?.trim(),
        quantity_produced: parseInt(formData.get('quantity_produced'), 10),
        npc_sell_price: parseInt(formData.get('npc_sell_price'), 10) || 0,
        materials: materials
    };

    if (!updatedData.name || !updatedData.quantity_produced || updatedData.quantity_produced <= 0) {
        ui.showStatusMessage(elements.editFormStatus, 'Erro: Nome e Quantidade Produzida (> 0) são obrigatórios.', 'error');
        return;
    }
    if (updatedData.materials.length === 0) {
         ui.showStatusMessage(elements.editFormStatus, 'Erro: Adicione pelo menos um material.', 'error');
         return;
    }

    try {
        await api.updateItem(itemId, updatedData);
        ui.showStatusMessage(elements.editStatus, `Item "${updatedData.name}" atualizado com sucesso!`, "success");
        hideEditForm(); // Esconde e reseta form após sucesso
        loadItemsForEditing(); // Recarrega a lista
    } catch (error) {
        console.error(`Erro ao atualizar item ${itemId}:`, error);
        ui.showStatusMessage(elements.editFormStatus, `Erro ao salvar: ${error.message || 'Erro desconhecido.'}`, "error");
    }
}

/**
 * Lida com a deleção de um item.
 */
async function handleDelete(itemId, itemName) {
    if (!confirm(`Tem certeza que deseja deletar o item "${itemName}"? Esta ação não pode ser desfeita.`)) {
        return;
    }

    ui.showStatusMessage(elements.editStatus, `Deletando "${itemName}"...`, "loading");

    try {
        await api.deleteItem(itemId);
        ui.showStatusMessage(elements.editStatus, `Item "${itemName}" deletado com sucesso!`, "success");
        if (domElements.editItemIdInput.value === itemId) {
             hideEditForm(); // Esconde form se estava editando o item deletado
        }
        loadItemsForEditing(); // Recarrega a lista
    } catch (error) {
        console.error(`Erro ao deletar item ${itemId}:`, error);
        ui.showStatusMessage(elements.editStatus, `Erro ao deletar: ${error.message || 'Erro desconhecido.'}`, "error");
    }
}