import Logger from '../../../../../Shared/utils/logger.js';
import { state, actions } from './state.js';

export const eventHandlers = {
    // Phase 3: Initialize intelligent event delegation
    initEventDelegation: function () {
        if (state.eventDelegationInitialized) return;

        const boundHandler = this.handleDelegatedEvent.bind(this);
        actions.setBoundDelegatedHandler(boundHandler);
        document.addEventListener('click', boundHandler);
        actions.setEventDelegationInitialized(true);

        Logger.info('Event delegation system initialized for ProductRenderer');
    },

    // Phase 3: Centralized event handler
    handleDelegatedEvent: function (e) {
        const target = e.target;

        // Handle view toggle buttons
        if (target.classList && target.classList.contains('view-toggle-btn')) {
            e.preventDefault();
            this.toggleViewMode().then(() => {
                // Refresh the current view to apply the new mode
                const container = document.getElementById('content-container');
                if (container) {
                    return this.refreshCurrentView(container);
                }
            }).catch(err => {
                Logger.error('Error in view toggle:', err);
            });
            return;
        }

        // Handle back buttons (both floating and top nav)
        if (target.classList && (target.classList.contains('back-button') || target.classList.contains('top-back-btn'))) {
            e.preventDefault();
            const container = target.closest('.content-wrapper') || document.querySelector('.content-wrapper');
            if (container) this.handleBackButton(target);
            return;
        }

        // Handle price buttons
        if (target.classList && target.classList.contains('price-button')) {
            e.preventDefault();
            this.handlePriceButtonClick(target, e);
            return;
        }

        // Handle video thumbnails
        if ((target.classList && target.classList.contains('video-thumb')) || (target.classList && target.classList.contains('video-thumbnail'))) {
            e.preventDefault();
            this.handleVideoClick(target);
            return;
        }

        // Handle product images
        if (target.classList && target.classList.contains('product-image')) {
            e.preventDefault();
            this.handleImageClick(target);
            return;
        }

        // Handle product cards (grid view)
        if (target.classList && target.classList.contains('product-card')) {
            e.preventDefault();
            this.handleCardClick(target, e);
            return;
        }

        // Handle category cards
        if ((target.classList && target.classList.contains('category-card')) || target.closest('.category-card')) {
            e.preventDefault();
            this.handleCategoryCardClick(target);
            return;
        }

        // Handle modal close buttons
        if (target.classList && target.classList.contains('modal-close-btn')) {
            e.preventDefault();
            this.handleModalClose(target);
            return;
        }

        // Handle modal backdrop clicks
        if ((target.classList && target.classList.contains('modal-backdrop')) ||
            (target.classList && target.classList.contains('video-modal-backdrop')) ||
            (target.classList && target.classList.contains('image-modal-backdrop'))) {
            this.handleModalBackdropClick(target, e);
            return;
        }
    },

    // Phase 3: Cleanup event delegation
    destroyEventDelegation: function () {
        if (state.boundDelegatedHandler) {
            document.removeEventListener('click', state.boundDelegatedHandler);
            actions.setBoundDelegatedHandler(null);
            actions.setEventDelegationInitialized(false);
            Logger.info('Event delegation system destroyed');
        }
    },

    // Create view toggle button (optimized)
    createViewToggle: function (container) {
        // Initialize event delegation if not already done
        this.initEventDelegation();

        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'view-toggle-container';

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'view-toggle-btn';
        toggleBtn.textContent = state.currentViewMode === 'table' ? '🔲' : '📋';
        toggleBtn.classList.toggle('active', state.currentViewMode === 'grid');

        // No individual event listener needed - handled by delegation
        toggleContainer.appendChild(toggleBtn);
        return toggleContainer;
    },

    // Phase 3: Specific event handlers
    handleCategoryCardClick: function (target) {
        const categoryCard = target.closest('.category-card') || target;
        const category = categoryCard.dataset.category;

        if (category) {
            const container = categoryCard.closest('.content-wrapper') || document.querySelector('.content-wrapper');
            if (container) {
                this.renderLicorSubcategory(container, category);
            } else {
                Logger.error(`❌ No se encontró container para categoría ${category}`);
            }
        } else {
            Logger.warn('⚠️ No se encontró categoría en el elemento clickeado');
        }
    },

    handleModalClose: function (target) {
        const modal = target.closest('.modal-backdrop');
        if (modal) {
            modal.remove();
        }
    },

    handleModalBackdropClick: function (target, event) {
        // Only close if clicking directly on the backdrop, not on modal content
        if (event.target === target) {
            target.remove();
        }
    },

    handlePriceButtonClick: function (target, event) {
        if (target.disabled || (target.classList && target.classList.contains('non-selectable'))) {
            return;
        }

        // Si el modo de orden no está activo, mostrar un único modal y no delegar más
        if (!window.OrderSystem?.isOrderMode) {
            event.preventDefault();
            if (window.OrderSystem && typeof window.OrderSystem._showValidationModal === 'function') {
                window.OrderSystem._showValidationModal('Para agregar productos, primero presiona “Crear orden” en el menú.');
            }
            return;
        }

        const row = target.closest('tr');
        const card = target.closest('.product-card');

        if (row) {
            // Table view handling
            const nameCell = row.querySelector('.product-name');
            const priceText = target.textContent;
            const productName = nameCell.textContent;

            if (window.OrderSystem && window.OrderSystem.handleProductSelection) {
                window.OrderSystem.handleProductSelection(productName, priceText, row, event);
            }
        } else if (card) {
            // Grid view handling
            const productName = target.dataset.productName;
            const priceText = target.textContent;

            if (window.OrderSystem && window.OrderSystem.handleProductSelection) {
                window.OrderSystem.handleProductSelection(productName, priceText, card, event);
            }
        }
    },

    handleVideoClick: function (target) {
        const videoUrl = target.dataset.videoUrl || target.src;
        const fallbackUrl = target.dataset.videoUrlFallback;
        const productName = target.alt?.replace('Ver video de ', '') || target.alt?.replace('Video de ', '') || 'Producto';
        const categoryElement = target.closest('table, .product-grid');
        const category = categoryElement?.dataset.category;

        const modalCategory = (category === 'cervezas' || category === 'refrescos') ? category : null;
        this.showVideoModal(videoUrl, productName, modalCategory, fallbackUrl);
    },

    handleImageClick: function (target) {
        const imageUrl = target.src;
        const productName = target.alt || 'Producto';
        const categoryElement = target.closest('table, .product-grid');
        const category = categoryElement?.dataset.category;

        const modalCategory = (category === 'cervezas' || category === 'refrescos') ? category : null;
        this.showImageModal(imageUrl, productName, modalCategory);
    },

    handleCardClick: function (target, event) {
        // Handle card clicks if needed for future functionality
    },

    handleBackButton: function (target) {
        // Handle back button navigation based on context
        const wrapper = target.closest('.content-wrapper') || document.querySelector('.content-wrapper');

        if (wrapper) {
            // Check if we're in a liquor subcategory and need to go back to licores
            if (target.title === 'Volver a Licores' || target.dataset.action === 'back-to-licores') {

                // Get or create content container for rendering
                let container = wrapper.querySelector('#content-container');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'content-container';
                    const flexContainer = wrapper.querySelector('.content-container-flex');
                    if (flexContainer) {
                        flexContainer.insertBefore(container, flexContainer.firstChild);
                    } else {
                        wrapper.appendChild(container);
                    }
                } else {
                    // Clear only the content container, preserving sidebar
                    container.innerHTML = '';
                }

                this.renderLicores(container);

                // Ocultar botón de back en la barra superior y limpiar título
                const topBackBtn = document.getElementById('top-back-btn');
                const navTitle = document.getElementById('nav-title');

                if (topBackBtn) {
                    topBackBtn.classList.add('back-btn-hidden');
                    topBackBtn.removeAttribute('data-action');
                    topBackBtn.removeAttribute('title');

                    // Limpiar event listener específico
                    if (this._topBackBtnHandler) {
                        topBackBtn.removeEventListener('click', this._topBackBtnHandler);
                        this._topBackBtnHandler = null;
                    }
                }

                if (navTitle) {
                    navTitle.textContent = '';
                }
            } else {
                // Generic back navigation - could be extended for other contexts
            }
        }
    },
};
