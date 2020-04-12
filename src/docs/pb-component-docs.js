import { LitElement, html, css } from 'lit-element';
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/paper-checkbox';
import './pb-components-list.js';
import { PbComponentView } from './pb-component-view.js';

/**
 * An API viewer for webcomponents based on the JSON format produced
 * by web-component-analyzer.
 * 
 * @slot logo - HTML to show as logo on top of the drawer
 * @listens pb-api-component if another webcomponent should be shown
 */
export class PbComponentDocs extends LitElement {
    static get properties() {
        return {
            /**
             * Path to the JSON file generated by web-components-analyzer
             */
            file: {
                type: String
            },
            /**
             * Path to the JSON file mapping component names to available demo files
             */
            demo: {
                type: String
            },
            _target: {
                type: String,
                reflect: true
            },
            _json: {
                type: Object
            },
            _demosOnly: {
                type: Boolean
            }
        };
    }

    constructor() {
        super();
        this.file = null;
        this.demo = null;
        this._target = null;
        /** @type {PbComponentView} */
        this.view = null;
    }

    connectedCallback() {
        super.connectedCallback();

        const target = new URL(window.location).searchParams.get('_target');
        if (target) {
            this._target = target;
        }

        window.addEventListener('popstate', (ev) => {
            if (ev.state) {
                this.view.show(ev.state.component, ev.state.tab);
            } else {
                this.view.clear();
            }
        });

        document.addEventListener('pb-api-component', (/** @type {CustomEvent} */ ev) => {
            const { component, tab } = ev.detail;
            let url = `?component=${component.name}&tab=${tab}`;
            if (this._target) {
                url += `&_target=${this._target}`;
            }
            history.pushState({ component, tab }, "view component", url);
            this.view.show(component, tab);
        });
    }

    firstUpdated() {
        super.firstUpdated();

        this.view = /** @type {PbComponentView} */ (this.shadowRoot.getElementById('view'));

        this._load().then(() => {
            const url = new URL(window.location.href);
            const component = url.searchParams.get('component');
            const tab = url.searchParams.get('tab');
            if (component && tab) {
                const comp = this._json.tags.find((tag) => tag.name === component);
                if (comp) {
                    this.view.show(comp, parseInt(tab));
                }
            }
        });
    }

    _load() {
        return new Promise((resolve) => {
            fetch(this.file)
                .then((response) => response.json())
                .then((data) => {
                    this._loadDemos(data).then((dataWithDemo) => {
                        this._json = dataWithDemo;
                        resolve(dataWithDemo);
                    })
                });
        });
    }

    _loadDemos(json) {
        return new Promise((resolve) => {
            if (this.demo) {
                fetch(this.demo)
                    .then((response) => response.json())
                    .then((data) => {
                        this._demos = data;
                        json.tags.forEach((tag) => {
                            if (data[tag.name]) {
                                tag.demo = data[tag.name];
                            } else {
                                tag.demo = null;
                            }
                        });
                        resolve(json);
                    });
            } else {
                resolve(json);
            }
        });
    }

    _filter() {
        this._demosOnly = this.shadowRoot.getElementById('filter').checked;
    }

    render() {
        return html`
            <app-drawer-layout>
                <app-drawer id="drawer" align="left" slot="drawer" persistent>
                    <slot name="logo"></slot>
                    <paper-checkbox id="filter" @change="${this._filter}">only elements with demos</paper-checkbox>
                    <pb-components-list ?with-demo="${this._demosOnly}" .json="${this._json}"></pb-components-list>
                </app-drawer>
                <pb-component-view id="view" ._target="${this._target}"></pb-component-view>
            </app-drawer-layout>
        `;
    }

    static get styles() {
        return css`
            :host {
                display: block;
            }
            pb-components-list {
                height: calc(100vh - 64px);
                overflow: auto;
            }

            #filter {
                margin: 20px 10px;
            }
        `;
    }
}
customElements.define('pb-component-docs', PbComponentDocs);