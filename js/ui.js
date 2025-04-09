// craftraito/frontend/js/ui.js
// MODIFICADO: addMaterialInput agora usa placeholders e evita valores default ('0', '1')
// quando nenhum dado inicial é fornecido (materialData).

/**
 * Exibe uma mensagem de status em um elemento específico.
 * (Função showStatusMessage sem mudanças)
 */
export function showStatusMessage(elementId, message, type = 'info') {
    const statusElement = document.getElementById(elementId);
    if (!statusElement) { console.warn(`Elemento de status não encontrado: #${elementId}`); return; }
    statusElement.textContent = message; statusElement.className = 'status-message'; let autoHide = true;
    switch (type) {
        case 'success': statusElement.classList.add('status-success'); break;
        case 'error': statusElement.classList.add('status-error'); break;
        case 'loading': statusElement.classList.add('status-loading'); autoHide = false; break;
        case 'info': default: statusElement.classList.add('status-info'); break; // Usar classe CSS
    }
    statusElement.style.display = 'block';
     if (autoHide) {
         setTimeout(() => { if (statusElement.style.display !== 'none' && statusElement.textContent === message) { hideStatusMessage(elementId); }}, 5000);
     }
}

/**
 * Esconde a mensagem de status de um elemento.
 * (Função hideStatusMessage sem mudanças)
 */
export function hideStatusMessage(elementId) {
    const statusElement = document.getElementById(elementId);
    if (statusElement) { statusElement.style.display = 'none'; statusElement.textContent = ''; statusElement.className = 'status-message'; }
}

/**
 * Cria e adiciona um campo de material a um container.
 * @param {HTMLElement} container - O elemento container onde adicionar o campo.
 * @param {Object} [materialData={}] - Dados opcionais para pré-preencher (para edição).
 */
export function addMaterialInput(container, materialData = {}) {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'material-entry';

    const idSuffix = Date.now() + Math.random().toString(16).slice(2);

    // Input Nome
    const nameDiv = document.createElement('div');
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Nome Material:';
    nameLabel.htmlFor = `mat-name-${idSuffix}`;
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.name = 'material_name';
    nameInput.id = nameLabel.htmlFor;
    nameInput.value = materialData.material_name || '';
    nameInput.placeholder = "Nome do Material";
    nameInput.required = true;
    nameDiv.append(nameLabel, nameInput);

    // Input Quantidade
    const quantityDiv = document.createElement('div');
    const quantityLabel = document.createElement('label');
    quantityLabel.textContent = 'Qtd:';
    quantityLabel.htmlFor = `mat-qty-${idSuffix}`;
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.name = 'quantity';
    quantityInput.id = quantityLabel.htmlFor;
    quantityInput.value = materialData.quantity || '';
    quantityInput.placeholder = "1";
    quantityInput.min = '1';
    quantityInput.required = true;
    quantityDiv.append(quantityLabel, quantityInput);

    // Select Tipo
    const typeDiv = document.createElement('div');
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Tipo:';
    typeLabel.htmlFor = `mat-type-${idSuffix}`;
    const typeSelect = document.createElement('select');
    typeSelect.name = 'material_type';
    typeSelect.id = typeLabel.htmlFor;
    typeSelect.required = true;

    // Invert the order of 'buy' and 'profession' and remove 'drop'
    ['buy', 'profession'].forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        if (materialData.material_type === type) option.selected = true;
        typeSelect.appendChild(option);
    });
    typeDiv.append(typeLabel, typeSelect);

    // Input Preço NPC (visível condicionalmente)
    const npcPriceDiv = document.createElement('div');
    npcPriceDiv.className = 'npc-price-field-container';
    const npcLabel = document.createElement('label');
    npcLabel.textContent = 'Preço NPC (Ref):';
    npcLabel.htmlFor = `mat-npc-${idSuffix}`;
    const npcInput = document.createElement('input');
    npcInput.type = 'number';
    npcInput.name = 'default_npc_price';
    npcInput.id = npcLabel.htmlFor;
    npcInput.value = materialData.default_npc_price || '';
    npcInput.placeholder = "0";
    npcInput.min = '0';
    npcPriceDiv.append(npcLabel, npcInput);

     const toggleNpcPriceVisibility = () => {
         npcPriceDiv.style.display = (typeSelect.value === 'drop' || typeSelect.value === 'buy') ? 'block' : 'none';
     };
     typeSelect.addEventListener('change', toggleNpcPriceVisibility);

    // Botão Remover
    const removeButtonDiv = document.createElement('div');
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remover';
    removeButton.className = 'button button-danger remove-material-button';
    removeButton.onclick = () => entryDiv.remove();
    removeButtonDiv.appendChild(removeButton);

    entryDiv.appendChild(nameDiv);
    entryDiv.appendChild(quantityDiv);
    entryDiv.appendChild(typeDiv);
    entryDiv.appendChild(npcPriceDiv);
    entryDiv.appendChild(removeButtonDiv);

    container.appendChild(entryDiv);
    toggleNpcPriceVisibility();
}

/**
 * Coleta os dados dos materiais de um container.
 * (Função getMaterialsData sem mudanças)
 */
export function getMaterialsData(container) {
    const materials = [];
    const entries = container.querySelectorAll('.material-entry');
    let isValid = true;
    entries.forEach((entry, index) => {
        const nameInput = entry.querySelector('input[name="material_name"]');
        const quantityInput = entry.querySelector('input[name="quantity"]');
        const typeSelect = entry.querySelector('select[name="material_type"]');
        const npcPriceInput = entry.querySelector('input[name="default_npc_price"]');
        const name = nameInput ? nameInput.value.trim() : '';
        const quantity = quantityInput ? parseInt(quantityInput.value, 10) : NaN; // Usar NaN se falhar
        const type = typeSelect ? typeSelect.value : '';
        const npcPrice = npcPriceInput ? parseInt(npcPriceInput.value, 10) : NaN; // Usar NaN se falhar

        // Validação mais rigorosa
        if (!name) { console.error(`Material #${index + 1}: Nome vazio.`); isValid = false; }
        if (isNaN(quantity) || quantity <= 0) { console.error(`Material "${name || index + 1}": Quantidade inválida (${quantityInput?.value}). Deve ser número > 0.`); isValid = false; }
        if (!type || !['profession', 'drop', 'buy'].includes(type)) { console.error(`Material "${name || index + 1}": Tipo inválido (${type}).`); isValid = false; }
        // Preço NPC é opcional, mas se preenchido deve ser >= 0
        const npcPriceValue = (!isNaN(npcPrice) && npcPrice >= 0) ? npcPrice : 0; // Usa 0 se inválido ou não aplicável

        if (isValid) {
             materials.push({
                 material_name: name,
                 quantity: quantity,
                 material_type: type,
                 default_npc_price: (type !== 'profession') ? npcPriceValue : 0 // Garante 0 para profession
             });
        }
    });
    return isValid ? materials : null;
}

/**
 * Função para formatar moeda
 * (Função formatCurrency sem mudanças)
 */
export function formatCurrency(value) {
    if (typeof value !== 'number') return '0';
    return Math.floor(value).toLocaleString('pt-BR');
}