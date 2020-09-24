import { CompositeDisposable, MutableDisposable } from '../../../lifecycle';
import {
    PanelHeaderPart,
    PartInitParameters,
} from '../../../groupview/panel/parts';
import { addDisposableListener } from '../../../events';
import { toggleClass } from '../../../dom';

export class DefaultTab extends CompositeDisposable implements PanelHeaderPart {
    private _element: HTMLElement;
    private _isGroupActive: boolean;
    private _isPanelVisible: boolean;

    //
    private _content: HTMLElement;
    private _actionContainer: HTMLElement;
    private _list: HTMLElement;
    private action: HTMLElement;
    //
    private params: PartInitParameters;
    //
    private isDirtyDisposable = new MutableDisposable();

    get element() {
        return this._element;
    }

    get id() {
        return '__DEFAULT_TAB__';
    }

    constructor() {
        super();

        this._element = document.createElement('div');
        this._element.className = 'default-tab';
        //
        this._content = document.createElement('div');
        this._content.className = 'tab-content';
        //
        this._actionContainer = document.createElement('div');
        this._actionContainer.className = 'action-container';
        //
        this._list = document.createElement('ul');
        this._list.className = 'tab-list';
        //
        this.action = document.createElement('a');
        this.action.className = 'tab-action';
        //
        this._element.appendChild(this._content);
        this._element.appendChild(this._actionContainer);
        this._actionContainer.appendChild(this._list);
        this._list.appendChild(this.action);
        //
        this.addDisposables(
            addDisposableListener(this._actionContainer, 'mousedown', (ev) => {
                ev.preventDefault();
            })
        );

        this.render();
    }

    public toJSON() {
        return { id: this.id };
    }

    public init(params: PartInitParameters) {
        this.params = params;
        this._content.textContent = params.title;

        this.isDirtyDisposable.value = this.params.api.onDidDirtyChange(
            (event) => {
                const isDirty = event;
                toggleClass(this.action, 'dirty', isDirty);
            }
        );

        if (!this.params.suppressClosable) {
            addDisposableListener(this.action, 'click', (ev) => {
                ev.preventDefault(); //
                this.params.api.close();
            });
        } else {
            this.action.classList.add('disable-close');
        }
    }

    public setVisible(isPanelVisible: boolean, isGroupVisible: boolean) {
        this._isPanelVisible = isPanelVisible;
        this._isGroupActive = isGroupVisible;

        this.render();
    }

    private render() {
        //
    }
}