(function (root, factory) {
    'use strict';
    var isElectron = typeof module === 'object' && process && process.versions && process.versions.electron;
    if (!isElectron && typeof module === 'object') {
        module.exports = factory;
    } else if (typeof define === 'function' && define.amd) {
        define(function () {
            return factory;
        });
    } else {
        root.MediumEditorVanillaInsert = factory(root);
    }
}(this, function (root) {

    'use strict';


    var Insert = root.MediumEditor.Extension.extend({
        name: 'insert',
        buttons: [],
        firstButtonClass: 'medium-editor-button-first',
        lastButtonClass: 'medium-editor-button-last',
        init: function () {
            root.MediumEditor.Extension.prototype.init.apply(this, arguments);

            this.subscribe('editableKeydown', this.handleKeydown.bind(this));
            this.subscribe('editableClick', this.handleKeydown.bind(this));
            this.getEditorOption('elementsContainer').appendChild(this.getToolbarElement());
        },
        createToolbar: function () {
            var
                toolbar = this.document.createElement('div');

            toolbar.id = 'medium-editor-insert-toolbar-' + this.getEditorId();
            toolbar.className = 'medium-editor-toolbar';
            toolbar.className += ' medium-editor-stalker-toolbar';

            toolbar.appendChild(this.createToolbarButtons());

            this.attachEventHandlers();
            return toolbar;
        },

        createToolbarButtons: function () {
            var ul = this.document.createElement('ul'),
                self = this,
                li,
                btn,
                buttons,
                extension,
                buttonName,
                buttonOpts;

            ul.id = 'medium-editor-insert-toolbar-actions' + this.getEditorId();
            ul.className = 'medium-editor-toolbar-actions';
            ul.style.display = 'block';

            this.buttons.forEach(function (button) {
                if (typeof button === 'string') {
                    buttonName = button;
                    buttonOpts = null;
                } else {
                    buttonName = button.name;
                    buttonOpts = button;
                }

                // If the button already exists as an extension, it'll be returned
                // othwerise it'll create the default built-in button
                extension = this.base.addBuiltInExtension(buttonName, buttonOpts);

                if (extension && typeof extension.getButton === 'function') {
                    btn = extension.getButton(this.base, function() {
                        return self._focusedNode;
                    });
                    li = this.document.createElement('li');
                    if (root.MediumEditor.util.isElement(btn)) {
                        li.appendChild(btn);
                    } else {
                        li.innerHTML = btn;
                    }
                    ul.appendChild(li);
                }
            }, this);

            buttons = ul.querySelectorAll('button');
            if (buttons.length > 0) {
                buttons[0].classList.add(this.firstButtonClass);
                buttons[buttons.length - 1].classList.add(this.lastButtonClass);
            }

            return ul;
        },
        destroy: function () {
            if (this.toolbar) {
                if (this.toolbar.parentNode) {
                    this.toolbar.parentNode.removeChild(this.toolbar);
                }
                delete this.toolbar;
            }
        },

        // Toolbar accessors

        getInteractionElements: function () {
            return this.getToolbarElement();
        },
        getToolbarElement: function () {
            if (!this.toolbar) {
                this.toolbar = this.createToolbar();
            }

            return this.toolbar;
        },

        getToolbarActionsElement: function () {
            return this.getToolbarElement().querySelector('.medium-editor-toolbar-actions');
        },



        attachEventHandlers: function () {
            // MediumEditor custom events for when user beings and ends interaction with a contenteditable and its elements
            this.subscribe('focus', this.handleFocus.bind(this));

            // Handle mouseup on document for updating the selection in the toolbar
            this.on(this.document.documentElement, 'mouseup', this.handleDocumentMouseup.bind(this));

        },

        handleDocumentMouseup: function (event) {
            // Do not trigger checkState when mouseup fires over the toolbar
            if (event &&
                event.target &&
                root.MediumEditor.util.isDescendant(this.getToolbarElement(), event.target) &&
                root.MediumEditor.util.isDescendant(this._buttons, event.target)
            ) {
                return false;
            }
            this.hideToolbar();
        },

        handleFocus: function () {
            if (this._screwBlur) {
                this._screwBlur = false;
                return;
            }
            // Kill any previously delayed calls to hide the toolbar
            clearTimeout(this.hideTimeout);

            // Blur may fire even if we have a selection, so we want to prevent any delayed showToolbar
            // calls from happening in this specific case
            clearTimeout(this.delayShowTimeout);

            // Delay the call to hideToolbar to handle bug with multiple editors on the page at once
            this.hideTimeout = setTimeout(function () {
                this.hideToolbar();
            }.bind(this), 1);
        },

        showToolbar: function (event) {
            this.hideButtons();
            this._screwBlur = true;
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            this.getToolbarElement().classList.add('medium-editor-toolbar-active');
            this.getToolbarElement().style.left = this._buttons.style.left;
            this.getToolbarElement().style.top = this._buttons.style.top;
        },

        hideToolbar: function () {
            this.getToolbarElement().classList.remove('medium-editor-toolbar-active');
        },


        handleKeydown: function () {
            var self = this;
            requestAnimationFrame(function () {
                var
                    selection = self.getSelection(),
                    node;

                if (!selection || !selection.anchorNode) {
                    self.hideButtons();
                    return;
                }

                node = selection.anchorNode;

                while (node.nodeType !== 1 && node) {
                    node = node.parentNode;
                }

                if (!node) {
                    self.hideButtons();
                    return;
                }

                if (node.innerText.replace(/^\s+|\s+$/g, '').length > 0) {
                    self.hideButtons();
                    return;
                }
                self._selection = selection;
                self._focusedNode = node;
                self.showButtons(node);
            });
        },
        getSelection: function () {
            if (window.getSelection) {
                return window.getSelection();
            } else if (document.getSelection) {
                return document.getSelection();
            } else if (document.selection) {
                return document.selection.createRange().text;
            }
        },
        hideButtons: function (node) {
            this.getPlusIcon().style.display = 'none';
        },
        showButtons: function (node) {
            var buttons = this.getPlusIcon();


            var box = node.getBoundingClientRect(),
                xOffset = window.pageXOffset,
                yOffset = window.pageYOffset,
                x = box.left + xOffset - 35,
                y = box.top + yOffset;

            buttons.style.top = y + 'px';
            buttons.style.left = x + 'px';

            buttons.style.display = 'block';
            buttons.style.opacity = 1;

        },
        getPlusIcon: function () {
            if (!this._buttons) {
                this._buttons = document.createElement('a');
                this._buttons.innerHTML = '<svg version="1.1\" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 92 92" enable-background="new 0 0 92 92" xml:space="preserve"><path id="XMLID_933_" d="M72.5,46.5c0,2.5-2,4.5-4.5,4.5H50v17c0,2.5-2,4.5-4.5,4.5S41,70.5,41,68V51H24c-2.5,0-4.5-2-4.5-4.5 s2-4.5,4.5-4.5h17V24c0-2.5,2-4.5,4.5-4.5s4.5,2,4.5,4.5v18h18C70.5,42,72.5,44,72.5,46.5z"/></svg>';
                this._buttons.style.cursor = 'pointer';
                this._buttons.style.display = 'none';
                this._buttons.style.position = 'absolute';
                this._buttons.style.opacity = 0;
                this._buttons.setAttribute('data-me-insert-buttons', '');
                this._buttons.addEventListener('click', this.showToolbar.bind(this), true);
                document.body.appendChild(this._buttons);
            }
            return this._buttons;
        }
    });
    return Insert;
}));
