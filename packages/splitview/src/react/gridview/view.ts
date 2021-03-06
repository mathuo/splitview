import {
    GridviewPanel,
    GridviewInitParameters,
} from '../../gridview/gridviewPanel';
import { ReactPart, ReactPortalStore } from '../react';
import { IGridviewPanelProps } from './gridview';

export class ReactGridPanelView extends GridviewPanel {
    constructor(
        id: string,
        component: string,
        private readonly reactComponent: React.FunctionComponent<IGridviewPanelProps>,
        private readonly reactPortalStore: ReactPortalStore
    ) {
        super(id, component);
    }

    getComponent() {
        return new ReactPart(
            this.element,
            this.reactPortalStore,
            this.reactComponent,
            {
                ...(this.params?.params || {}),
                api: this.api,
                containerApi: (this.params as GridviewInitParameters)
                    .containerApi,
            }
        );
    }
}
