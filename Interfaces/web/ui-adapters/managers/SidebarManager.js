import { setSafeInnerHTML } from '../../../../Shared/utils/domUtils.js';

/**
 * Universal Sidebar Manager
 * 
 * Responsibilities:
 * 1. UI State Management (Open/Close) for ALL sidebars.
 * 2. Overlay/Backdrop Orchestration (One overlay to rule them all).
 * 3. Z-Index Governance & Scroll Locking.
 * 4. CSS Grid Layout Toggling for Desktop (preventing layout shifts).
 * 
 * @singleton
 */
class SidebarManager {
    constructor() {
        if (SidebarManager.instance) {
            return SidebarManager.instance;
        }

        this.activeSidebarId = null;
        this.overlay = null;
        this.appContainer = document.querySelector('.app-container');
        this.body = document.body;

        // Configuration
        this.config = {
            backdropClass: 'sidebar-backdrop',
            desktopBreakpoint: 1024, // Matches CSS logic
            openAttribute: 'data-sidebar-state',
            openValue: 'open'
        };

        this._initOverlay();
        this._bindGlobalEvents();

        SidebarManager.instance = this;
    }

    /**
     * Initializes the unified backdrop element
     */
    _initOverlay() {
        // cleanup existing
        const existing = document.querySelector(`.${this.config.backdropClass}`);
        if (existing) existing.remove();

        this.overlay = document.createElement('div');
        this.overlay.className = this.config.backdropClass;
        this.overlay.style.display = 'none'; // Hidden by default

        // Accessibility
        this.overlay.setAttribute('aria-hidden', 'true');

        // Event: Click overlay to close active sidebar
        this.overlay.addEventListener('click', () => {
            this.closeAll();
        });

        document.body.appendChild(this.overlay);
    }

    /**
     * Binds global keys (Escape)
     */
    _bindGlobalEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeSidebarId) {
                this.closeAll();
            }
        });

        // Optional: Listen for resize to reset state if needed?
        // For now, CSS Grid handles resilience, so JS resize listeners aren't strictly needed for layout.
    }

    /**
     * Opens a specific sidebar
     * @param {string} sidebarId - ID of the sidebar element
     */
    open(sidebarId) {
        console.log(`[SidebarManager] Opening ${sidebarId}`);
        console.trace(`[SidebarManager] Trace for ${sidebarId}`);
        const sidebar = document.getElementById(sidebarId);
        if (!sidebar) {
            console.error(`SidebarManager: ID #${sidebarId} not found.`);
            return;
        }

        // 1. Close others if different
        if (this.activeSidebarId && this.activeSidebarId !== sidebarId) {
            this.close(this.activeSidebarId);
        }

        // 2. Activate State
        this.activeSidebarId = sidebarId;
        this.lastOpenTime = Date.now();
        sidebar.classList.add('active', 'is-open'); // Support both conventions
        document.body.classList.add('sidebar-open');

        // 3. Show Overlay (Mobile) / Grid Shift (Desktop)
        this._updateEnvironment(true, sidebarId);

        // 4. Emit Event
        this._emitEvent('sidebar:open', { id: sidebarId });
    }

    /**
     * Closes a specific sidebar or the active one
     * @param {string} [sidebarId] - Optional. Defaults to active.
     */
    close(sidebarId = this.activeSidebarId) {
        console.log(`[SidebarManager] Closing ${sidebarId}`);
        if (!sidebarId || sidebarId !== this.activeSidebarId) return;

        const sidebar = document.getElementById(sidebarId);
        if (sidebar) {
            sidebar.classList.remove('active', 'is-open');
        }

        this.activeSidebarId = null;
        this.body.classList.remove('sidebar-open');
        this._updateEnvironment(false, sidebarId);

        // Emit Event
        this._emitEvent('sidebar:close', { id: sidebarId });
    }

    /**
     * Closes any open sidebar
     */
    closeAll() {
        if (this.activeSidebarId) {
            this.close(this.activeSidebarId);
        }
    }

    /**
     * Toggles a sidebar
     */
    toggle(sidebarId) {
        const now = Date.now();
        if (this.lastToggleTime && (now - this.lastToggleTime < 300)) {
            console.warn(`[SidebarManager] Toggle ignored (Debounce): ${sidebarId}`);
            return;
        }
        this.lastToggleTime = now;

        if (this.activeSidebarId === sidebarId) {
            this.close(sidebarId);
        } else {
            this.open(sidebarId);
        }
    }

    /**
     * Updates the global environment (Body, Overlay, AppContainer)
     * based on state and device capabilities.
     * 
     * @param {boolean} isOpen 
     * @param {string} sidebarId 
     */
    _updateEnvironment(isOpen, sidebarId) {
        // A. Overlay Logic (Always needed for mobile, maybe not for desktop depending on design)
        // Rule: If it's the "Order Sidebar" on Desktop, we might NOT want an overlay if we use Grid.
        // But for "Mobile Menu" or "Settings", we usually DO want overlay.

        const isDesktop = window.innerWidth >= this.config.desktopBreakpoint;
        const isOrderSidebar = sidebarId === 'order-sidebar' || sidebarId === 'side-panel'; // Legacy alias

        if (isOpen) {
            // SCROLL LOCK
            this.body.classList.add('sidebar-open');

            // DESKTOP GRID SHIFT
            // Case A: Order Sidebar (Right)
            if (isDesktop && isOrderSidebar) {
                if (this.appContainer) {
                    this.appContainer.setAttribute(this.config.openAttribute, this.config.openValue);
                    this.appContainer.classList.add('grid-shell-mode');
                }
                this.overlay.style.display = 'none';
            }
            // Case B: Navigation Drawer (Left)
            else if (isDesktop && sidebarId === 'drawer-menu') {
                if (this.appContainer) {
                    this.appContainer.style.setProperty('--nav-width', '280px');
                    this.appContainer.classList.add('grid-shell-mode');
                }
                this.overlay.style.display = 'none';
            }
            else {
                // MOBILE / OVERLAY MODE
                this.overlay.style.display = 'block';
                // Ensure AppContainer doesn't shift on mobile
                if (this.appContainer) {
                    this.appContainer.removeAttribute(this.config.openAttribute);
                    this.appContainer.classList.remove('grid-shell-mode');
                    this.appContainer.style.removeProperty('--nav-width');
                }
            }

        } else {
            // CLOSE STATE
            this.body.classList.remove('sidebar-open');
            this.overlay.style.display = 'none';
            if (this.appContainer) {
                this.appContainer.removeAttribute(this.config.openAttribute);
                this.appContainer.style.removeProperty('--nav-width');
            }
        }
    }

    _emitEvent(eventName, detail) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}

// Export Singleton
const sidebarManager = new SidebarManager();
export default sidebarManager;
