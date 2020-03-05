import { LitElement, html, css } from 'lit-element';
import { pbMixin } from './pb-mixin.js';
import { pbHotkeys } from "./pb-hotkeys.js";

/**
 * Navigate backward/forward in a document. This component does not implement any functionality itself.
 * It just sends a `pb-navigate` event when clicked. You may also assign a shortcut key by setting property
 * `keyboard`.
 *
 * @customElement
 * @polymer
 * @appliesMixin pbMixin
 * @demo demo/pb-view.html
 */
export class PbNavigation extends pbHotkeys(pbMixin(LitElement)) {

    static get properties() {
        return {
            ...super.properties,
            /**
             * The direction to navigate in, either `forward` or `backward`
             */
            direction: {
                type: String
            },
            _buttonClass: {
                type: String
            },
            /**
             * Register a shortcut key, e.g. 'left' or 'shift+left'
             */
            keyboard: {
                type: String
            }
        };
    }

    constructor() {
        super();
        this.direction = 'forward';
        this._buttonClass = '';
    }

    connectedCallback() {
        super.connectedCallback();

        if (this.keyboard) {
            this.hotkeys = {
                'next': this.keyboard
            }
        }
        
        this.subscribeTo('pb-update', this._update.bind(this));

        this.registerHotkey('next', () => this.emitTo('pb-navigate', { direction: this.direction }));
    }

    _update(ev) {
        if (this.direction === 'forward') {
            if (ev.detail.data.next) {
                this._buttonClass = '';
            } else {
                this._buttonClass = 'inactive';
            }
        } else if (ev.detail.data.previous) {
                this._buttonClass = '';
        } else {
            this._buttonClass = 'inactive';
        }
    }

    _handleClick() {
        this.emitTo('pb-navigate', { direction: this.direction });
    }

    render() {
        return html`
            <a id="button" @click="${this._handleClick}" class="${this._buttonClass}"><slot></slot></a>
        `;
    }

    static get styles() {
        return css`
            :host {
                display: inline;
            }
            .inactive {
                visibility: hidden;
            }
        `;
    }
}

customElements.define('pb-navigation', PbNavigation);
