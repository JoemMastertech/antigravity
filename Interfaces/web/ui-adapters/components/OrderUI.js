import { setSafeInnerHTML, showModal, hideModal } from '../../../../Shared/utils/domUtils.js';
import { formatPrice } from '../../../../Shared/utils/formatters.js';
import Logger from '../../../../Shared/utils/logger.js';
import { CONSTANTS, simpleHash } from './OrderLogic.js';
import { isJuiceOption } from '../../../../Shared/utils/calculationUtils.js';

export class OrderUI {
    constructor(controller) {
        this.controller = controller;
        this.eventDelegationInitialized = false;
    }

    initialize() {
        this.initEventDelegation();
        this._initOrientationListener();
    }

    // Event Delegation
    initEventDelegation() {
        if (this.eventDelegationInitialized) return;
        document.addEventListener('click', (e) => this.controller.handleDelegatedEvent(e));
        this.eventDelegationInitialized = true;
        Logger.debug('OrderSystem event delegation initialized');
    }

    // DOM Helpers
    _createElement(tag, className, textContent = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }

    // Modals
    showModal(modalId) { showModal(modalId); }
    hideModal(modalId) { hideModal(modalId); }

    _createSimpleModal(message, buttonText, onConfirm) {
        const modalBackdrop = this._createElement('div', 'modal-backdrop');
        const modalContent = this._createElement('div', 'modal-content');

        const modalTitle = this._createElement('h3');
        modalTitle.textContent = message;

        const modalActions = this._createElement('div', 'modal-actions');
        const confirmBtn = this._createElement('button', 'nav-button');
        confirmBtn.textContent = buttonText;
        confirmBtn.addEventListener('click', () => {
            document.body.removeChild(modalBackdrop);
            if (onConfirm) onConfirm();
        });

        modalActions.appendChild(confirmBtn);
        [modalTitle, modalActions].forEach(el => modalContent.appendChild(el));
        modalBackdrop.appendChild(modalContent);
        document.body.appendChild(modalBackdrop);
    }

    showValidationModal(message) {
        // We can import OrderSystemValidations here or use the one from Logic?
        // But OrderSystemValidations.showValidationModal calls createSimpleModal.
        // We can just implement it directly or use the helper.
        // Let's use the helper if we can import it, but circular dependency might be an issue if Logic imports Validations.
        // I'll just use _createSimpleModal directly since it's simple.
        this._createSimpleModal(message, 'Aceptar');
    }

    showConfirmationModal(title, message, onConfirm) {
        const modalBackdrop = this._createElement('div', 'modal-backdrop');
        const modalContent = this._createElement('div', 'modal-content');

        const modalTitle = this._createElement('h3');
        modalTitle.textContent = title;

        const modalMessage = this._createElement('p');
        modalMessage.textContent = message;
        modalMessage.className = 'modal-confirmation-message';

        const modalActions = this._createElement('div', 'modal-actions');
        const buttons = [
            { text: 'Aceptar', handler: () => { onConfirm(); document.body.removeChild(modalBackdrop); } },
            { text: 'Cancelar', handler: () => document.body.removeChild(modalBackdrop) }
        ];

        buttons.forEach(({ text, handler }) => {
            const btn = this._createElement('button', 'nav-button');
            btn.textContent = text;
            btn.addEventListener('click', handler);
            modalActions.appendChild(btn);
        });

        [modalTitle, modalMessage, modalActions].forEach(el => modalContent.appendChild(el));
        modalBackdrop.appendChild(modalContent);
        document.body.appendChild(modalBackdrop);
    }

    // Order Display
    updateOrderDisplay(items) {
        const orderItemsContainer = document.getElementById('order-items');
        if (!orderItemsContainer) {
            // Only log debug if we are in order mode, otherwise it's expected
            if (this.controller.isOrderMode) {
                Logger.debug('updateOrderDisplay: order-items not found');
            }
            return;
        }
        this._updateOrderDisplayContent(orderItemsContainer, items);
    }

    _updateOrderDisplayContent(orderItemsContainer, items) {
        orderItemsContainer.innerHTML = '';
        const orderTotalAmount = document.getElementById('order-total-amount');

        // Update total if element exists
        if (orderTotalAmount) {
            // Total calculation is done by logic/core, but we need to display it.
            // The controller should pass the total or we get it from core.
            // Let's assume controller updates the total separately or we do it here.
            // In original code, updateOrderDisplay calls core.getTotal().
            // I'll assume items is passed, but total?
            // I'll use controller.core.getTotal() for now.
            orderTotalAmount.textContent = formatPrice(this.controller.core.getTotal());
        }

        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'order-item';

            const itemHeader = document.createElement('div');
            itemHeader.className = 'order-item-header';

            const itemName = document.createElement('div');
            itemName.className = 'order-item-name';
            itemName.textContent = item.name;
            const nameKey = `product-name_${simpleHash((item.name || '').trim())}`;
            itemName.setAttribute('data-translate', nameKey);
            itemName.setAttribute('data-namespace', 'products');
            itemName.setAttribute('data-original-text', item.name || '');

            const removeButton = document.createElement('button');
            removeButton.className = 'remove-order-item';
            setSafeInnerHTML(removeButton, '&times;');
            removeButton.addEventListener('click', () => {
                this.controller.removeOrderItem(item.id);
            });

            itemHeader.appendChild(itemName);
            itemHeader.appendChild(removeButton);

            const itemPrice = document.createElement('div');
            itemPrice.className = 'order-item-price';
            itemPrice.textContent = formatPrice(item.price);

            itemElement.appendChild(itemHeader);
            itemElement.appendChild(itemPrice);

            if (item.customizations && item.customizations.length > 0) {
                item.customizations.forEach(customization => {
                    const customElem = document.createElement('div');
                    customElem.className = 'order-item-customization';
                    customElem.textContent = customization;
                    const optKey = `product-option_${simpleHash((customization || '').trim())}`;
                    customElem.setAttribute('data-translate', optKey);
                    customElem.setAttribute('data-namespace', 'products');
                    customElem.setAttribute('data-original-text', customization || '');
                    itemElement.appendChild(customElem);
                });
            }
            orderItemsContainer.appendChild(itemElement);
        });
    }

    // Order Mode UI
    toggleOrderModeUI(isActive) {
        const elements = {
            sidebar: document.getElementById(CONSTANTS.SELECTORS.SIDEBAR),
            tables: document.querySelectorAll(CONSTANTS.SELECTORS.TABLES),
            wrapper: document.querySelector('.content-wrapper'),
            orderBtn: document.getElementById(CONSTANTS.SELECTORS.ORDER_BTN),
            body: document.body
        };

        this._updateOrderButton(elements.orderBtn, isActive);
        this._updateSidebarVisibility(elements.sidebar, isActive);
        this._updateTablesMode(elements.tables, isActive);
        this._updateWrapperState(elements.wrapper, isActive);
        this._updateBodyState(elements.body, isActive);
    }

    _updateOrderButton(orderBtn, isActive) {
        this._updateHamburgerMenuButton(isActive);
    }

    async _updateHamburgerMenuButton(isActive) {
        const hamburgerButtons = document.querySelectorAll('#drawer-menu .nav-button');
        const createOrderBtn = Array.from(hamburgerButtons).find(btn =>
            btn.getAttribute('data-action') === 'createOrder'
        );

        if (createOrderBtn) {
            if (isActive) {
                createOrderBtn.setAttribute('data-translate', 'menu.cancel_order');
                createOrderBtn.setAttribute('data-namespace', 'menu');
                createOrderBtn.setAttribute('data-original-text', 'CANCELAR ORDEN');
                createOrderBtn.textContent = 'CANCELAR ORDEN';
            } else {
                createOrderBtn.setAttribute('data-translate', 'menu.create_order');
                createOrderBtn.setAttribute('data-namespace', 'menu');
                createOrderBtn.setAttribute('data-original-text', 'Crear orden');
                createOrderBtn.textContent = 'Crear orden';
            }
            // Translation logic omitted for brevity, can be added if needed
        }
    }

    _updateSidebarVisibility(sidebar, isActive) {
        if (sidebar && sidebar.classList) {
            const hasItems = this.controller.core && this.controller.core.getItems && this.controller.core.getItems().length > 0;
            const shouldBeVisible = isActive || hasItems;

            sidebar.classList.toggle('sidebar-visible', shouldBeVisible);
            sidebar.classList.toggle('sidebar-hidden', !shouldBeVisible);
            sidebar.classList.toggle('is-open', shouldBeVisible);

            if (shouldBeVisible) {
                document.body.classList.add('sidebar-open');
                this._handleMobileOrientation(sidebar);
            } else {
                document.body.classList.remove('sidebar-open');
                this._handleMobileHiding(sidebar);
            }

            const contentWrapper = document.querySelector('.content-wrapper');
            if (contentWrapper) {
                contentWrapper.classList.toggle('with-sidebar', shouldBeVisible && this._isLandscape());
            }
        }
    }

    _handleMobileOrientation(sidebar) {
        const isLandscape = this._isLandscape();
        sidebar.classList.remove('sidebar-mobile-portrait', 'sidebar-mobile-landscape',
            'sidebar-mobile-hidden', 'sidebar-landscape-hidden', 'active');
        if (isLandscape) {
            sidebar.classList.add('sidebar-mobile-landscape', 'active');
        } else {
            sidebar.classList.add('sidebar-mobile-portrait');
        }
    }

    _isLandscape() {
        return window.innerWidth > window.innerHeight;
    }

    _handleMobileHiding(sidebar) {
        const isLandscape = this._isLandscape();
        sidebar.classList.remove('sidebar-mobile-portrait', 'sidebar-mobile-landscape',
            'sidebar-mobile-hidden', 'sidebar-landscape-hidden', 'active');
        sidebar.classList.remove('is-open');

        if (isLandscape) {
            sidebar.classList.add('sidebar-landscape-hidden');
        } else {
            sidebar.classList.add('sidebar-mobile-hidden');
        }
    }

    _initOrientationListener() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this._handleOrientationChange(), 100);
        });
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this._handleOrientationChange(), 150);
        });
    }

    _handleOrientationChange() {
        const sidebar = document.getElementById(CONSTANTS.SELECTORS.SIDEBAR);
        if (sidebar && sidebar.classList.contains('sidebar-visible')) {
            this._handleMobileOrientation(sidebar);
            const contentWrapper = document.querySelector('.content-wrapper');
            if (contentWrapper) {
                contentWrapper.classList.toggle('with-sidebar', this._isLandscape());
            }
        }
    }

    _updateTablesMode(tables, isActive) {
        if (tables) {
            tables.forEach(table => {
                if (table && table.classList) {
                    table.classList.toggle('price-selection-mode', isActive);
                }
            });
        }
    }

    _updateWrapperState(wrapper, isActive) {
        if (wrapper && wrapper.classList) {
            wrapper.classList.toggle('order-active', isActive);
        }
    }

    _updateBodyState(body, isActive) {
        if (body && body.classList) {
            body.classList.toggle('order-mode-active', isActive);
        }
    }


    // Drink Options UI
    // Drink Options UI
    showDrinkOptionsModal() {
        this.renderModalFromTemplate('drink-options-modal', 'drink-options-template');
        // Use setTimeout to ensure DOM is updated before setup
        setTimeout(() => this._setupDrinkModal(), 50);
    }

    renderDrinkOptions(container, options) {
        if (!Array.isArray(options)) {
            Logger.error('renderDrinkOptions: options is not an array:', options);
            return;
        }

        options.forEach(option => {
            container.appendChild(option === 'Ninguno' ? this._createNoneOption(option) : this._createDrinkOption(option));
        });
    }

    renderOptionsGrid(container, options) {
        if (!Array.isArray(options)) {
            Logger.error('renderOptionsGrid: options is not an array:', options);
            return;
        }

        const optionsGrid = this._createElement('div', 'options-grid drink-modal__grid');

        options.forEach(option => {
            const optionButton = this._createElement('button', 'drink-option drink-modal__option nav-button');
            optionButton.textContent = option;

            // Translation attributes
            const key = `drink_options.${simpleHash(option)}`;
            optionButton.setAttribute('data-translate', key);
            optionButton.setAttribute('data-namespace', 'menu');
            optionButton.setAttribute('data-original-text', option);

            // Add click handler for single selection
            optionButton.addEventListener('click', () => {
                // Deselect all
                container.querySelectorAll('.drink-option').forEach(btn => {
                    btn.classList.remove('selected');
                });
                // Select clicked
                optionButton.classList.add('selected');
                // Update controller state
                this.controller.logic.selectedDrinks = [option];
                this.controller.logic.drinkCounts = {};
            });

            optionsGrid.appendChild(optionButton);
        });

        container.appendChild(optionsGrid);
    }

    _setupDrinkModal() {
        const { drinkOptions } = this.controller.logic.getDrinkOptionsForProduct(this.controller.logic.currentProduct.name);
        const optionsContainer = document.getElementById('drink-options-container');
        const priceType = this.controller.logic.currentProduct.priceType;

        if (optionsContainer) {
            optionsContainer.innerHTML = '';

            // Use grid for Liter/Cup, standard list with counters for Bottle
            if (priceType === CONSTANTS.PRICE_TYPES.LITER || priceType === CONSTANTS.PRICE_TYPES.CUP) {
                this.renderOptionsGrid(optionsContainer, drinkOptions);
                // Hide total count container for Liter/Cup as it's not relevant
                const totalCount = document.getElementById('total-drinks-count');
                if (totalCount && totalCount.parentElement) totalCount.parentElement.classList.add('hidden');
            } else {
                this.renderDrinkOptions(optionsContainer, drinkOptions);
                // Ensure total count is visible for bottles
                const totalCount = document.getElementById('total-drinks-count');
                if (totalCount && totalCount.parentElement) totalCount.parentElement.classList.remove('hidden');
                this.updateTotalDrinkCount();
            }
        }

        this._updateModalTitle();
        this.showModal('drink-options-modal');
    }

    _updateModalTitle() {
        if (!this.controller.logic.currentProduct) {
            Logger.error('No current product selected for modal title update');
            return;
        }
        const modalTitle = document.querySelector('#drink-options-modal h3');
        if (!modalTitle) return;

        const { message } = this.controller.logic.getDrinkOptionsForProduct(this.controller.logic.currentProduct.name);
        const baseTitle = '¿Con qué desea acompañar su bebida?';
        const styleSpan = '<span class="modal-subtitle">';
        const bottleCategory = this.controller.logic.bottleCategory;

        if (bottleCategory === 'VODKA' || bottleCategory === 'GINEBRA' || this.controller.logic.isSpecialBottleCategory()) {
            modalTitle.innerHTML = `${baseTitle}${styleSpan}Puedes elegir 2 Jarras de jugo ó 5 Refrescos ó 1 Jarra de jugo y 2 Refrescos</span>`;
        } else if (message === "Puedes elegir 5 refrescos") {
            modalTitle.innerHTML = `${baseTitle}${styleSpan}Puedes elegir 5 refrescos</span>`;
        } else {
            modalTitle.innerHTML = `${baseTitle}${styleSpan}${message}</span>`;
        }
        // Re-apply translation
        this._retranslateIfNeeded(document.getElementById('drink-options-modal'));
    }

    async _retranslateIfNeeded(scopeElement) {
        try {
            const TranslationServiceModule = await import('../../../../Shared/services/TranslationService.js');
            const TranslationService = TranslationServiceModule.default || TranslationServiceModule;
            const currentLang = typeof TranslationService.getCurrentLanguage === 'function'
                ? TranslationService.getCurrentLanguage()
                : 'es';
            if (currentLang && currentLang !== 'es') {
                try {
                    const DOMTranslatorModule = await import('../../../../Shared/services/DOMTranslator.js');
                    const DOMTranslator = DOMTranslatorModule.default || DOMTranslatorModule;
                    if (DOMTranslator && typeof DOMTranslator.translateElement === 'function') {
                        const root = scopeElement || document;
                        const elements = root.querySelectorAll('[data-translate], [data-translate-placeholder]');
                        await Promise.all(Array.from(elements).map(el => DOMTranslator.translateElement(el, currentLang)));
                    } else if (typeof TranslationService.translatePage === 'function') {
                        TranslationService.translatePage(currentLang);
                    }
                } catch (err) {
                    Logger.warn('DOMTranslator not available, using translatePage', err);
                    if (typeof TranslationService.translatePage === 'function') {
                        TranslationService.translatePage(currentLang);
                    }
                }
            }
        } catch (error) {
            Logger.warn('Failed to re-apply translation in OrderUI', error);
        }
    }

    _createNoneOption(option) {
        const noneOption = this._createElement('button', 'drink-option');
        noneOption.textContent = option;
        noneOption.setAttribute('data-original-text', option);
        noneOption.setAttribute('data-translate', `drinks.option.${simpleHash(option)}`);
        noneOption.setAttribute('data-namespace', 'drinks');

        noneOption.addEventListener('click', () => {
            // Handle none option click - usually clears selection or adds 'Ninguno'
            // For now, let's assume it's handled by delegation or we add a listener
            // In original code, it might have been handled by delegation or specific listener
            // Let's delegate to controller
            this.controller.handleOptionClick(option);
        });
        return noneOption;
    }

    _createDrinkOption(option) {
        const optionContainer = this._createElement('div', 'drink-option-container');
        const optionName = this._createElement('span', 'drink-option-name');
        optionName.textContent = option;
        optionName.setAttribute('data-original-text', option);
        optionName.setAttribute('data-translate', `drinks.option.${simpleHash(option)}`);
        optionName.setAttribute('data-namespace', 'drinks');

        const counterContainer = this._createElement('div', 'counter-container');
        const countDisplay = this._createElement('span', 'count-display', '0');

        // Initialize count if exists in logic
        const currentCount = this.controller.logic.drinkCounts[option] || 0;
        countDisplay.textContent = currentCount;

        const decrementBtn = this._createCounterButton('-', () => this._handleDrinkDecrement(option, countDisplay, optionContainer));
        const incrementBtn = this._createCounterButton('+', () => this._handleDrinkIncrement(option, countDisplay, optionContainer));

        counterContainer.append(decrementBtn, countDisplay, incrementBtn);
        optionContainer.append(optionName, counterContainer);
        return optionContainer;
    }

    _createCounterButton(text, clickHandler) {
        const btn = this._createElement('button', 'counter-btn');
        btn.textContent = text;
        if (clickHandler) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent bubbling if needed
                clickHandler();
            });
        }
        return btn;
    }

    _handleDrinkDecrement(option, countDisplay, optionContainer) {
        const newCount = this.controller.handleDrinkDecrement(option);
        if (newCount !== null) {
            countDisplay.textContent = newCount;
            this.updateTotalDrinkCount();
        }
    }

    _handleDrinkIncrement(option, countDisplay, optionContainer) {
        const newCount = this.controller.handleDrinkIncrement(option);
        if (newCount !== null) {
            countDisplay.textContent = newCount;
            this.updateTotalDrinkCount();
        }
    }

    updateTotalDrinkCount() {
        const totalCountElement = document.getElementById('total-drinks-count');
        const total = this.controller.logic.calculateTotalDrinkCount();
        if (totalCountElement) totalCountElement.textContent = total;

        // Update buttons disabled state
        const maxCount = this.controller.logic.maxDrinkCount;
        const isSpecial = this.controller.logic.isSpecialDrinkProduct(); // We need to expose this in logic

        document.querySelectorAll('.drink-option-container .counter-btn').forEach(btn => {
            if (btn.textContent === '+') {
                // Simple check for now, can be more complex with special rules
                btn.disabled = total >= maxCount;
            }
        });
    }

    // Customization Modals
    showFoodCustomizationModal() {
        this.renderModalFromTemplate('food-customization-modal', 'food-customization-template');
        setTimeout(() => this._setupFoodModal(), 50);
    }

    _setupFoodModal() {
        const ingredientsContainer = document.getElementById('ingredients-input-container');
        if (ingredientsContainer) ingredientsContainer.className = 'input-container-hidden';
        const ingredientsInput = document.getElementById('ingredients-to-remove');
        if (ingredientsInput) ingredientsInput.value = '';
        this.showModal('food-customization-modal');
    }

    showMeatCustomizationModal() {
        this.renderModalFromTemplate('meat-customization-modal', 'meat-customization-template');
        setTimeout(() => this._setupMeatModal(), 50);
    }

    _setupMeatModal() {
        const garnishContainer = document.getElementById('garnish-input-container');
        if (garnishContainer) garnishContainer.className = 'input-container-hidden';

        const garnishActions = document.querySelector('.garnish-actions');
        if (garnishActions) garnishActions.className = 'modal-actions garnish-actions input-container-hidden';

        const garnishModifications = document.getElementById('garnish-modifications');
        if (garnishModifications) garnishModifications.value = '';

        this.controller.logic.selectedCookingTerm = null;
        this._setupCookingOptions();
        this.showModal('meat-customization-modal');
    }

    _setupCookingOptions() {
        const cookingOptions = document.querySelectorAll('.cooking-option');
        cookingOptions.forEach(option => {
            option.classList.remove('selected');
            option.addEventListener('click', (e) => {
                cookingOptions.forEach(opt => opt.classList.remove('selected'));
                e.target.classList.add('selected');
                this.controller.logic.selectedCookingTerm = e.target.getAttribute('data-term');
            });
        });
    }

    renderModalFromTemplate(modalId, templateId) {
        const modal = document.getElementById(modalId);
        const template = document.getElementById(templateId);

        if (!modal || !template) {
            Logger.error('renderModalFromTemplate: Modal or Template not found', { modalId, templateId });
            return;
        }

        modal.innerHTML = '';
        const content = template.content.cloneNode(true);
        modal.appendChild(content);
    }

    _initOrientationListener() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this._handleOrientationChange(), 100);
        });
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this._handleOrientationChange(), 150);
        });
    }

    _handleOrientationChange() {
        const sidebar = document.getElementById(CONSTANTS.SELECTORS.SIDEBAR);
        if (sidebar && sidebar.classList.contains('sidebar-visible')) {
            this._handleMobileOrientation(sidebar);
            const contentWrapper = document.querySelector('.content-wrapper');
            if (contentWrapper) {
                contentWrapper.classList.toggle('with-sidebar', this._isLandscape());
            }
        }
    }

    _updateTablesMode(tables, isActive) {
        if (tables) {
            tables.forEach(table => {
                if (table && table.classList) {
                    table.classList.toggle('price-selection-mode', isActive);
                }
            });
        }
    }

    _updateWrapperState(wrapper, isActive) {
        if (wrapper && wrapper.classList) {
            wrapper.classList.toggle('order-active', isActive);
        }
    }

    _updateBodyState(body, isActive) {
        if (body && body.classList) {
            body.classList.toggle('order-mode-active', isActive);
        }
    }


    // Drink Options UI
    renderDrinkOptions(container, options) {
        if (!Array.isArray(options)) {
            Logger.error('renderDrinkOptions: options is not an array:', options);
            return;
        }

        options.forEach(option => {
            container.appendChild(option === 'Ninguno' ? this._createNoneOption(option) : this._createDrinkOption(option));
        });
    }

    _createNoneOption(option) {
        const noneOption = this._createElement('button', 'drink-option');
        noneOption.textContent = option;
        noneOption.setAttribute('data-original-text', option);
        noneOption.setAttribute('data-translate', `drinks.option.${simpleHash(option)}`);
        noneOption.setAttribute('data-namespace', 'drinks');

        noneOption.addEventListener('click', () => {
            // Handle none option click - usually clears selection or adds 'Ninguno'
            // For now, let's assume it's handled by delegation or we add a listener
            // In original code, it might have been handled by delegation or specific listener
            // Let's delegate to controller
            this.controller.handleOptionClick(option);
        });
        return noneOption;
    }

    _createDrinkOption(option) {
        const optionContainer = this._createElement('div', 'drink-option-container');
        const optionName = this._createElement('span', 'drink-option-name');
        optionName.textContent = option;
        optionName.setAttribute('data-original-text', option);
        optionName.setAttribute('data-translate', `drinks.option.${simpleHash(option)}`);
        optionName.setAttribute('data-namespace', 'drinks');

        const counterContainer = this._createElement('div', 'counter-container');
        const countDisplay = this._createElement('span', 'count-display', '0');

        // Initialize count if exists in logic
        const currentCount = this.controller.logic.drinkCounts[option] || 0;
        countDisplay.textContent = currentCount;
        if (currentCount > 0) optionContainer.classList.add('selected');

        const decrementBtn = this._createCounterButton('-', () => this._handleDrinkDecrement(option, countDisplay, optionContainer));
        const incrementBtn = this._createCounterButton('+', () => this._handleDrinkIncrement(option, countDisplay, optionContainer));

        counterContainer.append(decrementBtn, countDisplay, incrementBtn);
        optionContainer.append(optionName, counterContainer);
        return optionContainer;
    }

    _createCounterButton(text, clickHandler) {
        const btn = this._createElement('button', 'counter-btn');
        btn.textContent = text;
        if (clickHandler) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent bubbling if needed
                clickHandler();
            });
        }
        return btn;
    }

    _handleDrinkDecrement(option, countDisplay, optionContainer) {
        const newCount = this.controller.handleDrinkDecrement(option);
        if (newCount !== null) {
            countDisplay.textContent = newCount;
            if (newCount === 0) {
                optionContainer.classList.remove('selected');
            }
            this.updateTotalDrinkCount();
        }
    }

    _handleDrinkIncrement(option, countDisplay, optionContainer) {
        const newCount = this.controller.handleDrinkIncrement(option);
        if (newCount !== null) {
            countDisplay.textContent = newCount;
            optionContainer.classList.add('selected');
            this.updateTotalDrinkCount();
        }
    }

    updateTotalDrinkCount() {
        const totalCountElement = document.getElementById('total-drinks-count');
        const total = this.controller.logic.calculateTotalDrinkCount();
        if (totalCountElement) totalCountElement.textContent = total;

        // Update buttons disabled state
        const maxCount = this.controller.logic.maxDrinkCount;
        const isSpecial = this.controller.logic.isSpecialDrinkProduct(); // We need to expose this in logic

        document.querySelectorAll('.drink-option-container .counter-btn').forEach(btn => {
            if (btn.textContent === '+') {
                // Simple check for now, can be more complex with special rules
                btn.disabled = total >= maxCount;
            }
        });
    }

    // Customization Modals
    showFoodCustomizationModal() {
        this.renderModalFromTemplate('food-customization-modal', 'food-customization-template');
        setTimeout(() => this._setupFoodModal(), 50);
    }

    _setupFoodModal() {
        const ingredientsContainer = document.getElementById('ingredients-input-container');
        if (ingredientsContainer) ingredientsContainer.className = 'input-container-hidden';
        const ingredientsInput = document.getElementById('ingredients-to-remove');
        if (ingredientsInput) ingredientsInput.value = '';

        // Set up button event listeners
        const keepIngredientsBtn = document.getElementById('keep-ingredients-btn');
        const customizeIngredientsBtn = document.getElementById('customize-ingredients-btn');
        const confirmIngredientsBtn = document.getElementById('confirm-ingredients-btn');
        const cancelIngredientsBtn = document.getElementById('cancel-ingredients-btn');

        if (keepIngredientsBtn) {
            keepIngredientsBtn.addEventListener('click', () => {
                // Add product with 'Con todo' description
                this.controller.addProductToOrder({
                    name: this.controller.logic.currentProduct.name,
                    price: this.controller.logic.currentProduct.price,
                    category: this.controller.logic.currentCategory,
                    customizations: ['Con todo']
                });
                this.hideModal('food-customization-modal');
            });
        }

        if (customizeIngredientsBtn) {
            customizeIngredientsBtn.addEventListener('click', () => {
                // Hide the Sí/No buttons
                const ingredientsChoice = document.querySelector('.ingredients-choice');
                if (ingredientsChoice) {
                    ingredientsChoice.classList.add('hidden');
                }

                // Show textarea for ingredient customization
                if (ingredientsContainer) {
                    ingredientsContainer.className = 'input-container-visible';
                }
                if (ingredientsInput) {
                    ingredientsInput.focus();
                }
            });
        }

        if (confirmIngredientsBtn) {
            confirmIngredientsBtn.addEventListener('click', () => {
                // Add product with ingredient modifications
                const modifications = ingredientsInput ? ingredientsInput.value.trim() : '';
                const customizations = modifications ? [`Sin: ${modifications}`] : [];

                this.controller.addProductToOrder({
                    name: this.controller.logic.currentProduct.name,
                    price: this.controller.logic.currentProduct.price,
                    category: this.controller.logic.currentCategory,
                    customizations
                });
                this.hideModal('food-customization-modal');
            });
        }

        if (cancelIngredientsBtn) {
            cancelIngredientsBtn.addEventListener('click', () => {
                // Just close the modal without adding
                this.hideModal('food-customization-modal');
            });
        }

        this.showModal('food-customization-modal');
    }


    showMeatCustomizationModal() {
        this.renderModalFromTemplate('meat-customization-modal', 'meat-customization-template');
        setTimeout(() => this._setupMeatModal(), 50);
    }

    showPlatosCustomizationModal() {
        this.renderModalFromTemplate('platos-customization-modal', 'platos-customization-template');
        setTimeout(() => this._setupPlatosModal(), 50);
    }

    _setupPlatosModal() {
        const garnishContainer = document.getElementById('garnish-platos-input-container');
        if (garnishContainer) garnishContainer.className = 'input-container-hidden';

        const garnishModifications = document.getElementById('garnish-platos-modifications');
        if (garnishModifications) garnishModifications.value = '';

        // Set up garnish choice buttons
        const changeGarnishBtn = document.getElementById('change-garnish-platos-btn');
        const keepGarnishBtn = document.getElementById('keep-garnish-platos-btn');
        const confirmGarnishBtn = document.getElementById('confirm-garnish-platos-btn');
        const cancelGarnishBtn = document.getElementById('cancel-garnish-platos-btn');

        if (changeGarnishBtn) {
            changeGarnishBtn.addEventListener('click', () => {
                // Hide the Sí/No buttons
                const garnishChoice = document.querySelector('.garnish-choice-platos');
                if (garnishChoice) {
                    garnishChoice.classList.add('hidden');
                }

                // Show textarea for garnish modifications
                if (garnishContainer) {
                    garnishContainer.className = 'input-container-visible';
                }
                if (garnishModifications) {
                    garnishModifications.focus();
                }
            });
        }

        if (keepGarnishBtn) {
            keepGarnishBtn.addEventListener('click', () => {
                // Add product with standard garnish
                this.controller.addProductToOrder({
                    name: this.controller.logic.currentProduct.name,
                    price: this.controller.logic.currentProduct.price,
                    category: this.controller.logic.currentCategory,
                    customizations: ['Guarnición estándar']
                });

                this.hideModal('platos-customization-modal');
            });
        }

        if (confirmGarnishBtn) {
            confirmGarnishBtn.addEventListener('click', () => {
                // Add product with garnish modifications
                const garnishText = garnishModifications ? garnishModifications.value.trim() : '';
                const customizations = garnishText ? [`Guarnición: ${garnishText}`] : ['Guarnición estándar'];

                this.controller.addProductToOrder({
                    name: this.controller.logic.currentProduct.name,
                    price: this.controller.logic.currentProduct.price,
                    category: this.controller.logic.currentCategory,
                    customizations
                });

                this.hideModal('platos-customization-modal');
            });
        }

        if (cancelGarnishBtn) {
            cancelGarnishBtn.addEventListener('click', () => {
                // Just close the modal without adding
                this.hideModal('platos-customization-modal');
            });
        }

        this.showModal('platos-customization-modal');
    }

    _setupMeatModal() {
        const garnishContainer = document.getElementById('garnish-input-container');
        if (garnishContainer) garnishContainer.classList.add('hidden');

        const garnishActions = document.querySelector('.garnish-actions');
        if (garnishActions) garnishActions.classList.add('modal-actions', 'garnish-actions', 'hidden');

        const garnishModifications = document.getElementById('garnish-modifications');
        if (garnishModifications) garnishModifications.value = '';

        this.controller.logic.selectedCookingTerm = null;
        this._setupCookingOptions();

        // Set up garnish choice buttons
        const changeGarnishBtn = document.getElementById('change-garnish-btn');
        const keepGarnishBtn = document.getElementById('keep-garnish-btn');
        const confirmGarnishBtn = document.getElementById('confirm-garnish-btn');
        const cancelGarnishBtn = document.getElementById('cancel-garnish-btn');

        if (changeGarnishBtn) {
            changeGarnishBtn.addEventListener('click', () => {
                // Hide the Sí/No buttons
                const garnishChoice = document.querySelector('.garnish-choice');
                if (garnishChoice) {
                    garnishChoice.classList.add('hidden');
                }

                // Show textarea for garnish modifications
                if (garnishContainer) {
                    garnishContainer.classList.remove('hidden');
                    garnishContainer.classList.add('input-container-visible');
                }
                if (garnishModifications) {
                    garnishModifications.focus();
                }

                // Show Confirmar/Cancelar buttons
                if (garnishActions) {
                    garnishActions.classList.remove('hidden');
                }
            });
        }

        if (keepGarnishBtn) {
            keepGarnishBtn.addEventListener('click', () => {
                // Validate cooking term is selected first
                if (!this.controller.logic.selectedCookingTerm) {
                    this.showValidationModal('Por favor seleccione un término de cocción.');
                    return;
                }

                // Add product with cooking term and standard garnish
                const termLabels = {
                    'medio': 'Término ½',
                    'tres-cuartos': 'Término ¾',
                    'bien-cocido': 'Bien Cocido'
                };
                const customizations = [
                    termLabels[this.controller.logic.selectedCookingTerm] || this.controller.logic.selectedCookingTerm,
                    'Guarnición estándar'
                ];

                this.controller.addProductToOrder({
                    name: this.controller.logic.currentProduct.name,
                    price: this.controller.logic.currentProduct.price,
                    category: this.controller.logic.currentCategory,
                    customizations
                });

                this.hideModal('meat-customization-modal');
            });
        }

        if (confirmGarnishBtn) {
            confirmGarnishBtn.addEventListener('click', () => {
                // Validate cooking term is selected
                if (!this.controller.logic.selectedCookingTerm) {
                    this.showValidationModal('Por favor seleccione un término de cocción.');
                    return;
                }

                // Build customizations array
                const customizations = [];

                // Add cooking term
                const termLabels = {
                    'medio': 'Término ½',
                    'tres-cuartos': 'Término ¾',
                    'bien-cocido': 'Bien Cocido'
                };
                customizations.push(termLabels[this.controller.logic.selectedCookingTerm] || this.controller.logic.selectedCookingTerm);

                // Add garnish modifications if any
                const garnishText = garnishModifications ? garnishModifications.value.trim() : '';
                if (garnishText) {
                    customizations.push(`Guarnición: ${garnishText}`);
                }

                // Add product to order
                this.controller.addProductToOrder({
                    name: this.controller.logic.currentProduct.name,
                    price: this.controller.logic.currentProduct.price,
                    category: this.controller.logic.currentCategory,
                    customizations
                });

                this.hideModal('meat-customization-modal');
            });
        }

        if (cancelGarnishBtn) {
            cancelGarnishBtn.addEventListener('click', () => {
                // Just close the modal without adding
                this.hideModal('meat-customization-modal');
            });
        }

        this.showModal('meat-customization-modal');
    }

    _setupCookingOptions() {
        const cookingOptions = document.querySelectorAll('.cooking-option');
        cookingOptions.forEach(option => {
            option.classList.remove('selected');
            option.addEventListener('click', (e) => {
                cookingOptions.forEach(opt => opt.classList.remove('selected'));
                e.target.classList.add('selected');
                this.controller.logic.selectedCookingTerm = e.target.getAttribute('data-term');
            });
        });
    }

    renderModalFromTemplate(modalId, templateId) {
        const template = document.getElementById(templateId);
        if (!template) {
            Logger.error(`Template ${templateId} not found`);
            return;
        }

        let modal = document.getElementById(modalId);
        if (!modal) {
            // Create wrapper if it doesn't exist
            const className = `modal modal-hidden modal--${modalId.replace('-modal', '')}`;
            modal = this._createElement('div', className);
            modal.id = modalId;
            document.body.appendChild(modal);
        } else {
            // Clear existing content
            modal.innerHTML = '';
        }

        const clone = template.content.cloneNode(true);
        modal.appendChild(clone);
    }

    // ==================== Orders Screen UI ====================

    showOrdersScreen(orders, isHistory = false) {
        Logger.info('Showing orders screen', { orderCount: orders.length, isHistory });

        const elements = {
            mainContentScreen: document.querySelector('.main-content-screen'),
            contentContainer: document.getElementById('content-container'),
            hamburgerBtn: document.getElementById('hamburger-btn'),
            ordersScreen: document.querySelector('.orders-screen')
        };

        // Hide hamburger button
        if (elements.hamburgerBtn) {
            elements.hamburgerBtn.className = 'hamburger-btn hamburger-hidden';
        }

        // Hide main content
        if (elements.contentContainer) {
            elements.contentContainer.className = 'content-hidden';
        }

        // Remove existing orders screen to avoid duplicates
        if (elements.ordersScreen && elements.ordersScreen.parentNode) {
            elements.ordersScreen.parentNode.removeChild(elements.ordersScreen);
        }

        // Create and append new orders screen
        if (elements.mainContentScreen) {
            elements.mainContentScreen.appendChild(this._createOrdersScreen(orders, isHistory));
        }
    }

    _createOrdersScreen(orders, isHistory) {
        const ordersScreen = this._createElement('div', 'orders-screen');

        const header = this._createOrdersHeader(isHistory);
        const ordersListContainer = this._createElement('div', 'orders-list-container');
        const ordersList = this._createElement('div', isHistory ? 'history-list-content' : 'orders-list', 'orders-list');

        // Populate orders
        this._populateOrdersList(ordersList, orders, isHistory);

        ordersListContainer.appendChild(ordersList);
        ordersScreen.appendChild(header);
        ordersScreen.appendChild(ordersListContainer);

        // Add clear history button if showing history
        if (isHistory && orders.length > 0) {
            this._createFixedBottomButton(ordersScreen, 'Limpiar Historial', () => {
                this.controller.handleClearHistory();
            });
        }

        return ordersScreen;
    }

    _createOrdersHeader(isHistory) {
        const header = this._createElement('div', ' orders-screen-header');

        const backBtn = this._createElement('button', 'nav-button orders-back-btn', 'Volver');
        backBtn.addEventListener('click', async () => {
            await this.controller.hideOrdersScreen();
        });

        const historyBtn = this._createElement('button', 'nav-button history-btn', isHistory ? 'Ver Activas' : 'Ver Historial');
        historyBtn.addEventListener('click', () => {
            this.controller.toggleOrderHistoryView();
        });

        header.appendChild(backBtn);
        header.appendChild(historyBtn);

        return header;
    }

    _populateOrdersList(container, orders, includeDeleteButton) {
        container.innerHTML = '';

        if (orders.length === 0) {
            const emptyMsg = this._createElement('div');
            emptyMsg.className = 'orders-empty-state';
            emptyMsg.textContent = includeDeleteButton ? 'No hay órdenes en el historial.' : 'No hay órdenes guardadas.';
            container.appendChild(emptyMsg);
            return;
        }

        orders.forEach((order) => {
            container.appendChild(this._createOrderElement(order, includeDeleteButton));
        });
    }

    _createOrderElement(order, includeDeleteButton) {
        const orderElement = this._createElement('div', 'saved-order');

        // Order header with timestamp
        const header = this._createElement('h3');
        header.textContent = `Orden - ${order.completedAt || new Date(order.timestamp).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}`;
        orderElement.appendChild(header);

        // Order items list
        const itemsList = this._createElement('div', 'saved-order-items');
        order.items.forEach(item => {
            const itemDiv = this._createElement('div', 'saved-order-item');

            const itemName = this._createElement('div', 'saved-order-item-name');
            itemName.textContent = item.name;
            itemDiv.appendChild(itemName);

            if (item.customizations && item.customizations.length > 0) {
                const customizations = this._createElement('div', 'saved-order-item-customization');
                customizations.textContent = item.customizations.join(', ');
                itemDiv.appendChild(customizations);
            }

            const itemPrice = this._createElement('div', 'saved-order-item-price');
            itemPrice.textContent = formatPrice(item.price);
            itemDiv.appendChild(itemPrice);

            itemsList.appendChild(itemDiv);
        });
        orderElement.appendChild(itemsList);

        // Order total
        const totalDiv = this._createElement('div', 'saved-order-total');
        totalDiv.textContent = `Total: ${formatPrice(order.total)}`;
        orderElement.appendChild(totalDiv);

        // Delete button if  needed
        if (includeDeleteButton) {
            const deleteBtn = this._createElement('button', 'nav-button delete-order-btn', 'Eliminar');
            deleteBtn.addEventListener('click', () => {
                this.controller.handleDeleteOrder(order.id);
            });
            orderElement.appendChild(deleteBtn);
        }

        return orderElement;
    }

    _createFixedBottomButton(parentContainer, buttonText, onClick) {
        const fixedContainer = this._createElement('div', 'fixed-bottom-actions');
        // Styles moved to .fixed-bottom-actions in _orders.scss

        const button = this._createElement('button', 'nav-button clear-history-btn', buttonText);
        // Styles moved to .clear-history-btn in _orders.scss
        button.addEventListener('click', onClick);

        fixedContainer.appendChild(button);
        parentContainer.appendChild(fixedContainer);
    }

    async hideOrdersScreen() {
        const ordersScreen = document.querySelector('.orders-screen');
        if (ordersScreen && ordersScreen.parentNode) {
            ordersScreen.parentNode.removeChild(ordersScreen);
        }

        // Show hamburger button
        const hamburgerBtn = document.getElementById('hamburger-btn');
        if (hamburgerBtn) {
            hamburgerBtn.className = 'hamburger-btn';
        }

        // Show content container
        const contentContainer = document.getElementById('content-container');
        if (contentContainer) {
            contentContainer.className = 'content-container';
        }
    }

    updateOrdersDisplay(orders, isHistory) {
        const ordersList = document.querySelector(isHistory ? '.history-list-content' : '.orders-list');
        if (ordersList) {
            this._populateOrdersList(ordersList, orders, !isHistory);
        }
    }
}
