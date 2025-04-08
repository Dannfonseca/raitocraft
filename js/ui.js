// craftraito/frontend/js/ui.js
// Adicionadas classes CSS distintas para cada sub-div dentro de .material-entry
// para facilitar a estilização com grid-template-areas.

export function showStatusMessage(elementId, message, type = 'info') {
    const statusElement = document.getElementById(elementId);
    if (!statusElement) {
         console.warn(`Elemento de status não encontrado: #${elementId}`);
         return;
    }

    statusElement.textContent = message;
    statusElement.className = 'status-message'; // Reseta classes
    let autoHide = true;

    switch (type) {
        case 'success': statusElement.classList.add('status-success'); break;
        case 'error': statusElement.classList.add('status-error'); break;
        case 'loading': statusElement.classList.add('status-loading'); autoHide = false; break;
        case 'info': // Mudado para usar classe CSS em vez de style inline
             statusElement.classList.add('status-info');
             break;
        default: // Mantem um estilo padrão se nenhuma classe for aplicada
            statusElement.style.display = 'block';
            statusElement.style.backgroundColor = 'rgba(52, 152, 219, 0.2)'; // Cor info do tema light
            statusElement.style.color = '#0c5464'; // Cor do texto da classe status-info
            statusElement.style.border = '1px solid #bee5eb'; // Cor da borda da classe status-info
            break;
    }
    statusElement.style.display = 'block'; // Garante visibilidade

     if (autoHide) {
         setTimeout(() => {
             if (statusElement.style.display !== 'none' && statusElement.textContent === message) {
                 hideStatusMessage(elementId);
             }
         }, 5000);
     }
}


export function hideStatusMessage(elementId) {
    const statusElement = document.getElementById(elementId);
    if (statusElement) {
        statusElement.style.display = 'none';
        statusElement.textContent = '';
        statusElement.className = 'status-message';
    }
}

/**
 * Cria e adiciona um campo de material a um container. (Classes Adicionadas)
 * @param {HTMLElement} container - O elemento container onde adicionar o campo.
 * @param {Object} [materialData={}] - Dados opcionais para pré-preencher (para edição).
 */
export function addMaterialInput(container, materialData = {}) {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'material-entry';

    const idSuffix = Date.now() + Math.random().toString(16).slice(2);

    // Input Nome
    const nameDiv = document.createElement('div');
    nameDiv.className = 'mat-name-div'; // <<< Classe Adicionada
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Nome Material:';
    nameLabel.htmlFor = `mat-name-${idSuffix}`;
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.name = 'material_name';
    nameInput.id = nameLabel.htmlFor;
    nameInput.value = materialData.material_name || '';
    nameInput.required = true;
    nameDiv.append(nameLabel, nameInput);


    // Input Quantidade
    const quantityDiv = document.createElement('div');
    quantityDiv.className = 'mat-qty-div'; // <<< Classe Adicionada
    const quantityLabel = document.createElement('label');
    quantityLabel.textContent = 'Qtd:';
    quantityLabel.htmlFor = `mat-qty-${idSuffix}`;
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.name = 'quantity';
    quantityInput.id = quantityLabel.htmlFor;
    quantityInput.value = materialData.quantity || 1;
    quantityInput.min = '1';
    quantityInput.required = true;
    quantityDiv.append(quantityLabel, quantityInput);

    // Select Tipo
    const typeDiv = document.createElement('div');
    typeDiv.className = 'mat-type-div'; // <<< Classe Adicionada
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Tipo:';
    typeLabel.htmlFor = `mat-type-${idSuffix}`;
    const typeSelect = document.createElement('select');
    typeSelect.name = 'material_type';
    typeSelect.id = typeLabel.htmlFor;
    typeSelect.required = true;
    ['profession', 'drop', 'buy'].forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        if (materialData.material_type === type) option.selected = true;
        typeSelect.appendChild(option);
    });
    typeDiv.append(typeLabel, typeSelect);


    // Input Preço NPC (visível condicionalmente)
    const npcPriceDiv = document.createElement('div');
    npcPriceDiv.className = 'mat-npc-div'; // <<< Classe Adicionada
    const npcLabel = document.createElement('label');
    npcLabel.textContent = 'Preço NPC (Ref):';
    npcLabel.htmlFor = `mat-npc-${idSuffix}`;
    const npcInput = document.createElement('input');
    npcInput.type = 'number';
    npcInput.name = 'default_npc_price';
    npcInput.id = npcLabel.htmlFor;
    npcInput.value = materialData.default_npc_price || 0;
    npcInput.min = '0';
    npcPriceDiv.append(npcLabel, npcInput);

     const toggleNpcPriceVisibility = () => {
         npcPriceDiv.style.display = (typeSelect.value === 'drop' || typeSelect.value === 'buy') ? 'block' : 'none';
     };
     typeSelect.addEventListener('change', toggleNpcPriceVisibility);


    // Botão Remover
    const removeButtonDiv = document.createElement('div');
    removeButtonDiv.className = 'mat-remove-div'; // <<< Classe Adicionada
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remover';
    removeButton.className = 'button button-danger'; // Classe base + danger
    removeButton.onclick = () => entryDiv.remove();
    removeButtonDiv.appendChild(removeButton);


    entryDiv.appendChild(nameDiv);
    entryDiv.appendChild(quantityDiv);
    entryDiv.appendChild(typeDiv);
    entryDiv.appendChild(npcPriceDiv);
    entryDiv.appendChild(removeButtonDiv);

    container.appendChild(entryDiv);
    toggleNpcPriceVisibility(); // Chama após adicionar ao DOM
}


export function getMaterialsData(container) {
    const materials = [];
    const entries = container.querySelectorAll('.material-entry');
    let isValid = true;

    entries.forEach((entry, index) => {
        const nameInput = entry.querySelector('.mat-name-div input[name="material_name"]'); // Ajustado para usar classe
        const quantityInput = entry.querySelector('.mat-qty-div input[name="quantity"]'); // Ajustado
        const typeSelect = entry.querySelector('.mat-type-div select[name="material_type"]'); // Ajustado
        const npcPriceInput = entry.querySelector('.mat-npc-div input[name="default_npc_price"]'); // Ajustado

        const name = nameInput ? nameInput.value.trim() : '';
        const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 0;
        const type = typeSelect ? typeSelect.value : '';
        const npcPrice = npcPriceInput ? parseInt(npcPriceInput.value, 10) : 0;

        // Validações permanecem as mesmas
        if (!name) { console.error(`Material #${index + 1}: Nome está vazio.`); isValid = false; nameInput?.focus(); }
        if (!quantity || quantity <= 0) { console.error(`Material "${name || index + 1}": Quantidade inválida (${quantityInput?.value}).`); isValid = false; quantityInput?.focus(); }
        if (!type || !['profession', 'drop', 'buy'].includes(type)) { console.error(`Material "${name || index + 1}": Tipo inválido (${type}).`); isValid = false; typeSelect?.focus(); }

        if (isValid) {
             materials.push({
                 material_name: name,
                 quantity: quantity,
                 material_type: type,
                 // Garante que npcPrice seja 0 se não for aplicável ou inválido
                 default_npc_price: (type !== 'profession' && !isNaN(npcPrice) && npcPrice >= 0) ? npcPrice : 0
             });
        } else {
            // Se já for inválido, podemos parar a iteração ou apenas coletar erros
            // Por enquanto, apenas marca como inválido e continua para pegar todos os erros
        }
    });
    // Retorna null apenas se alguma validação falhou
    return isValid ? materials : null;
}


export function formatCurrency(value) {
    if (typeof value !== 'number') return '0';
    return Math.floor(value).toLocaleString('pt-BR');
}