/**
 * Terbium Frameless Window Helper v2.7
 * 
 * Helper utilities for building apps with frameless/custom windows in Terbium.
 * This library handles the complex coordinate math and messaging required for
 * frameless window dragging to work identically to standard Terbium windows.
 * 
 * Frameless windows now support ALL the same behaviors as normal windows:
 * - Click, hold, and drag to move (real-time, smooth dragging)
 * - Double-click to maximize/restore
 * - Edge snapping with preview
 * - Smooth transitions and animations
 * - Window controls (minimize, maximize, close)
 * - Proper click handling (simple clicks work normally, no interference)
 * 
 * HOW IT WORKS:
 * The helper sends continuous mouse position updates to the parent window during
 * drag operations. This allows smooth, real-time window movement even though the
 * mouse events originate inside the iframe.
 * 
 * @example Basic usage:
 * ```html
 * <script src="/terbium-frameless.js"></script>
 * <script>
 *   TerbiumFrameless.init({
 *     dragSelector: '.my-titlebar',
 *     noDragSelectors: ['.window-controls', 'button', 'input'],
 *     enableDoubleClick: true  // Enable double-click to maximize (default: true)
 *   });
 * </script>
 * ```
 * 
 * @example Manual drag trigger:
 * ```javascript
 * element.addEventListener('mousedown', function(e) {
 *   if (shouldDrag) {
 *     TerbiumFrameless.startDrag(e);
 *   }
 * });
 * ```
 */
(function(window) {
    'use strict';
    const TerbiumFrameless = {
        /**
         * Initialize frameless window drag behavior
         * Makes frameless windows behave identically to standard Terbium windows
         * 
         * Drag behavior: 
         * - Prevents text selection when clicking titlebar
         * - Drag only starts when mouse moves while button is held
         * - Uses original mousedown coordinates for proper offset calculation
         * - Exactly matches normal window behavior
         * 
         * @param {Object} options Configuration options
         * @param {string} options.dragSelector - CSS selector for draggable area (e.g., '.titlebar')
         * @param {string[]} options.noDragSelectors - CSS selectors that should NOT trigger drag
         * @param {boolean} options.enableDoubleClick - Enable double-click to maximize (default: true)
         *                                               Respects the doubleClickMaximize setting in window config
         * @param {Function} options.onDragStart - Callback when drag starts (only fires on mouse movement)
         * @param {Function} options.onDragEnd - Callback when drag ends (only fires if drag actually started)
         */
        init: function(options) {
            const config = {
                dragSelector: options.dragSelector || '.titlebar',
                noDragSelectors: options.noDragSelectors || [],
                enableDoubleClick: options.enableDoubleClick !== false,
                onDragStart: options.onDragStart || null,
                onDragEnd: options.onDragEnd || null
            };
            const dragElement = document.querySelector(config.dragSelector);
            if (!dragElement) {
                console.warn('[TerbiumFrameless] Drag element not found:', config.dragSelector);
                return;
            }
            dragElement.addEventListener('mousedown', function(e) {
                for (const selector of config.noDragSelectors) {
                    if (e.target.closest(selector)) {
                        return;
                    }
                }                
                e.preventDefault();
                const iframeRect = window.frameElement?.getBoundingClientRect();
                if (!iframeRect) {
                    console.warn('[TerbiumFrameless] Not running inside iframe');
                    return;
                }
                let dragStarted = false;
                const wid = window.frameElement?.closest('.window-element')?.id;                
                const startParentX = e.clientX + iframeRect.left;
                const startParentY = e.clientY + iframeRect.top;                
                const onMouseMove = function(moveEvent) {
                    const currentRect = window.frameElement?.getBoundingClientRect();
                    if (!currentRect) return;                    
                    const parentX = moveEvent.clientX + currentRect.left;
                    const parentY = moveEvent.clientY + currentRect.top;
                    if (!dragStarted) {
                        dragStarted = true;
                        window.parent.postMessage({
                            type: 'tb-frameless-drag-start',
                            wid: wid,
                            parentX: startParentX,
                            parentY: startParentY
                        }, '*');
                        if (config.onDragStart) {
                            config.onDragStart(e);
                        }
                    }                    
                    window.parent.postMessage({
                        type: 'tb-frameless-drag-move',
                        wid: wid,
                        parentX: parentX,
                        parentY: parentY
                    }, '*');
                };
                const onMouseUp = function() {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    if (dragStarted) {
                        window.parent.postMessage({
                            type: 'tb-frameless-drag-end',
                            wid: wid
                        }, '*');
                        if (config.onDragEnd) {
                            config.onDragEnd();
                        }
                    }
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
            if (config.enableDoubleClick) {
                dragElement.addEventListener('dblclick', function(e) {
                    for (const selector of config.noDragSelectors) {
                        if (e.target.closest(selector)) {
                            return;
                        }
                    }
                    const iframeRect = window.frameElement?.getBoundingClientRect();
                    if (iframeRect) {
                        window.parent.postMessage({
                            type: 'tb-frameless-dblclick',
                            wid: window.frameElement?.closest('.window-element')?.id
                        }, '*');
                    } else {
                        TerbiumFrameless.maximize();
                    }
                });
            }
            console.log('[TerbiumFrameless] Initialized with config:', config);
        },
        /**
         * Start a drag operation (can be called manually)
         * @param {MouseEvent} e - The mousedown event
         */
        startDrag: function(e) {
            e.preventDefault();
            const iframeRect = window.frameElement?.getBoundingClientRect();
            if (!iframeRect) {
                console.warn('[TerbiumFrameless] Not running inside iframe');
                return;
            }
            const parentClientX = e.clientX + iframeRect.left;
            const parentClientY = e.clientY + iframeRect.top;
            window.parent.postMessage({
                type: 'tb-frameless-drag-start',
                wid: window.frameElement?.closest('.window-element')?.id,
                parentX: parentClientX,
                parentY: parentClientY
            }, '*');
        },
        /**
         * Start drag from a specific element region (useful for canvas-based UIs)
         * @param {MouseEvent} e - The mousedown event
         * @param {Object} bounds - The bounds to check { top, bottom, left, right } in pixels
         * @returns {boolean} - Whether drag was initiated
         */
        startDragInBounds: function(e, bounds) {
            const element = e.target;
            const rect = element.getBoundingClientRect();
            const relativeX = e.clientX - rect.left;
            const relativeY = e.clientY - rect.top;
            if (
                (bounds.top === undefined || relativeY >= bounds.top) &&
                (bounds.bottom === undefined || relativeY <= bounds.bottom) &&
                (bounds.left === undefined || relativeX >= bounds.left) &&
                (bounds.right === undefined || relativeX <= bounds.right)
            ) {
                this.startDrag(e);
                return true;
            }
            return false;
        },
        /**
         * Maximize the current window (uses Terbium API)
         */
        maximize: function() {
            if (typeof tb !== 'undefined' && tb.window && tb.window.maximize) {
                tb.window.maximize();
            } else {
                console.warn('[TerbiumFrameless] tb.window.maximize not available');
            }
        },
        /**
         * Minimize the current window (uses Terbium API)
         */
        minimize: function() {
            if (typeof tb !== 'undefined' && tb.window && tb.window.minimize) {
                tb.window.minimize();
            } else {
                console.warn('[TerbiumFrameless] tb.window.minimize not available');
            }
        },
        /**
         * Close the current window (uses Terbium API)
         */
        close: function() {
            if (typeof tb !== 'undefined' && tb.window && tb.window.close) {
                tb.window.close();
            } else {
                console.warn('[TerbiumFrameless] tb.window.close not available');
            }
        },
        /**
         * Helper to create standard window control buttons
         * @param {HTMLElement} container - Container element to append buttons to
         * @param {Object} options - Options for controls
         * @param {boolean} options.minimize - Show minimize button (default: true)
         * @param {boolean} options.maximize - Show maximize button (default: true)
         * @param {boolean} options.close - Show close button (default: true)
         * @param {string} options.theme - Theme style: 'windows', 'macos', 'chrome' (default: 'chrome')
         * @returns {Object} - Object with button elements { minimize, maximize, close }
         */
        createControls: function(container, options) {
            const config = {
                minimize: options.minimize !== false,
                maximize: options.maximize !== false,
                close: options.close !== false,
                theme: options.theme || 'chrome'
            };
            const controls = {};
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'window-controls';            
            const themes = {
                chrome: {
                    container: 'display: flex; gap: 4px;',
                    button: 'width: 28px; height: 28px; border: none; background: transparent; cursor: pointer; border-radius: 3px; font-size: 16px; color: #444;',
                    hover: 'background: rgba(0,0,0,0.1);',
                    closeHover: 'background: rgba(200,0,0,0.8); color: white;'
                },
                windows: {
                    container: 'display: flex; gap: 0;',
                    button: 'width: 46px; height: 32px; border: none; background: transparent; cursor: pointer; font-size: 12px; color: #000;',
                    hover: 'background: rgba(0,0,0,0.05);',
                    closeHover: 'background: #e81123; color: white;'
                },
                macos: {
                    container: 'display: flex; gap: 8px; padding-left: 8px;',
                    button: 'width: 12px; height: 12px; border-radius: 50%; border: none; cursor: pointer;',
                    colors: { close: '#ff5f57', minimize: '#ffbd2e', maximize: '#28c940' }
                }
            };
            const theme = themes[config.theme] || themes.chrome;
            controlsDiv.style.cssText = theme.container;
            if (config.minimize) {
                const btn = document.createElement('button');
                btn.className = 'control-minimize';
                btn.setAttribute('aria-label', 'Minimize');
                if (config.theme === 'macos') {
                    btn.style.cssText = theme.button + `background: ${theme.colors.minimize};`;
                } else {
                    btn.textContent = '−';
                    btn.style.cssText = theme.button;
                    btn.onmouseover = () => btn.style.background = theme.hover;
                    btn.onmouseout = () => btn.style.background = 'transparent';
                }
                btn.onclick = () => this.minimize();
                controlsDiv.appendChild(btn);
                controls.minimize = btn;
            }
            if (config.maximize) {
                const btn = document.createElement('button');
                btn.className = 'control-maximize';
                btn.setAttribute('aria-label', 'Maximize');
                if (config.theme === 'macos') {
                    btn.style.cssText = theme.button + `background: ${theme.colors.maximize};`;
                } else {
                    btn.textContent = '□';
                    btn.style.cssText = theme.button;
                    btn.onmouseover = () => btn.style.background = theme.hover;
                    btn.onmouseout = () => btn.style.background = 'transparent';
                }
                btn.onclick = () => this.maximize();
                controlsDiv.appendChild(btn);
                controls.maximize = btn;
            }
            if (config.close) {
                const btn = document.createElement('button');
                btn.className = 'control-close';
                btn.setAttribute('aria-label', 'Close');
                if (config.theme === 'macos') {
                    btn.style.cssText = theme.button + `background: ${theme.colors.close};`;
                } else {
                    btn.textContent = '×';
                    btn.style.cssText = theme.button;
                    btn.onmouseover = () => btn.style.cssText = theme.button + theme.closeHover;
                    btn.onmouseout = () => btn.style.cssText = theme.button;
                }
                btn.onclick = () => this.close();
                controlsDiv.appendChild(btn);
                controls.close = btn;
            }
            container.appendChild(controlsDiv);
            return controls;
        }
    };
    window.TerbiumFrameless = TerbiumFrameless;
})(window);
