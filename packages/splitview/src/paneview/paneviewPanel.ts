import { PaneviewApi } from '../api/component.api';
import { PanePanelApi } from '../api/panePanelApi';
import { addDisposableListener, Emitter, Event } from '../events';
import {
    BasePanelView,
    BasePanelViewExported,
    BasePanelViewState,
} from '../gridview/basePanelView';
import { IDisposable } from '../lifecycle';
import {
    IFrameworkPart,
    PanelInitParameters,
    PanelUpdateEvent,
    Parameters,
} from '../panel/types';
import { IView, Orientation } from '../splitview/core/splitview';

export interface PanePanelViewState extends BasePanelViewState {
    headerComponent?: string;
    title: string;
}

export interface PanePanelInitParameter extends PanelInitParameters {
    minimumBodySize?: number;
    maximumBodySize?: number;
    isExpanded?: boolean;
    title: string;
    containerApi: PaneviewApi;
}

export interface PanePanelComponentInitParameter
    extends PanePanelInitParameter {
    api: PanePanelApi;
}

export interface IPaneBodyPart extends IDisposable {
    readonly element: HTMLElement;
    update(params: PanelUpdateEvent): void;
    init(parameters: PanePanelComponentInitParameter): void;
}

export interface IPaneHeaderPart extends IDisposable {
    readonly element: HTMLElement;
    update(params: PanelUpdateEvent): void;
    init(parameters: PanePanelComponentInitParameter): void;
}

export interface IPaneview extends IView {
    onDidChangeExpansionState: Event<boolean>;
}

export interface IPaneviewPanel extends BasePanelViewExported<PanePanelApi> {
    readonly minimumSize: number;
    readonly maximumSize: number;
    readonly minimumBodySize: number;
    readonly maximumBodySize: number;
    isExpanded(): boolean;
    setExpanded(isExpanded: boolean): void;
}

export abstract class PaneviewPanel
    extends BasePanelView<PanePanelApi>
    implements IPaneview, IPaneviewPanel {
    private _onDidChangeExpansionState: Emitter<boolean> = new Emitter<boolean>(
        { replay: true }
    );
    onDidChangeExpansionState = this._onDidChangeExpansionState.event;
    private readonly _onDidChange = new Emitter<number | undefined>();
    readonly onDidChange: Event<number | undefined> = this._onDidChange.event;

    private headerSize = 22;
    private _orthogonalSize = 0;
    private _minimumBodySize = 0;
    private _maximumBodySize: number = Number.POSITIVE_INFINITY;
    private _isExpanded = false;
    protected header?: HTMLElement;
    protected body?: HTMLElement;
    private bodyPart?: IPaneHeaderPart;
    private headerPart?: IPaneBodyPart;
    private expandedSize = 0;
    private animationTimer: any | undefined;

    private _orientation: Orientation;

    set orientation(value: Orientation) {
        this._orientation = value;
    }

    get orientation() {
        return this._orientation;
    }

    get minimumSize(): number {
        const headerSize = this.headerSize;
        const expanded = this.isExpanded();
        const minimumBodySize = expanded ? this._minimumBodySize : 0;

        return headerSize + minimumBodySize;
    }

    get maximumSize(): number {
        const headerSize = this.headerSize;
        const expanded = this.isExpanded();
        const maximumBodySize = expanded ? this._maximumBodySize : 0;

        return headerSize + maximumBodySize;
    }

    get orthogonalSize() {
        return this._orthogonalSize;
    }

    set orthogonalSize(size: number) {
        this._orthogonalSize = size;
    }

    get minimumBodySize() {
        return this._minimumBodySize;
    }

    set minimumBodySize(value: number) {
        this._minimumBodySize = typeof value === 'number' ? value : 0;
    }

    get maximumBodySize() {
        return this._maximumBodySize;
    }

    set maximumBodySize(value: number) {
        this._maximumBodySize =
            typeof value === 'number' ? value : Number.POSITIVE_INFINITY;
    }

    constructor(
        id: string,
        component: string,
        private readonly headerComponent: string | undefined,
        orientation: Orientation,
        isExpanded: boolean
    ) {
        super(id, component, new PanePanelApi(id));
        this.api.pane = this; // TODO cannot use 'this' before 'super'
        this._isExpanded = isExpanded;

        this._onDidChangeExpansionState.fire(this.isExpanded()); // initialize value

        this._orientation = orientation;

        this.element.classList.add('pane');

        this.addDisposables(
            this.api.onDidSizeChange((event) => {
                this._onDidChange.fire(event.size);
            }),
            addDisposableListener(
                this.element,
                'mouseenter',
                (ev: MouseEvent) => {
                    this.api._onMouseEnter.fire(ev);
                }
            ),
            addDisposableListener(
                this.element,
                'mouseleave',
                (ev: MouseEvent) => {
                    this.api._onMouseLeave.fire(ev);
                }
            )
        );

        this.addDisposables(
            this._onDidChangeExpansionState,
            this.onDidChangeExpansionState((isExpanded) => {
                this.api._onDidExpansionChange.fire({ isExpanded });
            })
        );

        this.render();
    }

    setVisible(isVisible: boolean) {
        this.api._onDidVisibilityChange.fire({ isVisible });
    }

    setActive(isActive: boolean) {
        this.api._onDidActiveChange.fire({ isActive });
    }

    isExpanded(): boolean {
        return this._isExpanded;
    }

    setExpanded(expanded: boolean): void {
        if (this._isExpanded === expanded) {
            return;
        }

        this._isExpanded = expanded;

        if (expanded) {
            if (this.animationTimer) {
                clearTimeout(this.animationTimer);
            }
            if (this.body) {
                this.element.appendChild(this.body);
            }
        } else {
            this.animationTimer = setTimeout(() => {
                this.body?.remove();
            }, 200);
        }

        this._onDidChange.fire(expanded ? this.width : undefined);
        this._onDidChangeExpansionState.fire(expanded);
    }

    layout(size: number, orthogonalSize: number) {
        const [width, height] =
            this.orientation === Orientation.HORIZONTAL
                ? [size, orthogonalSize]
                : [orthogonalSize, size];
        if (this.isExpanded()) {
            this.expandedSize = width;
        }
        super.layout(width, height);
    }

    init(parameters: PanePanelInitParameter): void {
        super.init(parameters);

        if (typeof parameters.minimumBodySize === 'number') {
            this.minimumBodySize = parameters.minimumBodySize;
        }
        if (typeof parameters.maximumBodySize === 'number') {
            this.maximumBodySize = parameters.maximumBodySize;
        }

        this.bodyPart = this.getBodyComponent();
        this.headerPart = this.getHeaderComponent();

        this.bodyPart.init({ ...parameters, api: this.api });
        this.headerPart.init({ ...parameters, api: this.api });

        this.body?.append(this.bodyPart.element);
        this.header?.append(this.headerPart.element);

        if (typeof parameters.isExpanded === 'boolean') {
            this.setExpanded(parameters.isExpanded);
        }
    }

    toJSON(): PanePanelViewState {
        const params = this.params as PanePanelInitParameter;
        return {
            ...super.toJSON(),
            headerComponent: this.headerComponent,
            title: params.title,
        };
    }

    private render() {
        this.header = document.createElement('div');
        this.header.tabIndex = -1;

        this.header.className = 'pane-header';
        this.header.style.height = `${this.headerSize}px`;
        this.header.style.lineHeight = `${this.headerSize}px`;
        this.header.style.minHeight = `${this.headerSize}px`;
        this.header.style.maxHeight = `${this.headerSize}px`;

        this.element.appendChild(this.header);

        this.body = document.createElement('div');
        this.body.tabIndex = -1;

        this.body.className = 'pane-body';

        this.element.appendChild(this.body);
    }

    // TODO slightly hacky by-pass of the component to create a body and header component
    getComponent(): IFrameworkPart {
        return {
            update: (params: Parameters) => {
                this.bodyPart?.update({ params });
                this.headerPart?.update({ params });
            },
            dispose: () => {
                this.bodyPart?.dispose();
                this.headerPart?.dispose();
            },
        };
    }

    protected abstract getBodyComponent(): IPaneBodyPart;
    protected abstract getHeaderComponent(): IPaneHeaderPart;
}
