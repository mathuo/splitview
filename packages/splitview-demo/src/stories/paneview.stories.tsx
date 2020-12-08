import {
    PanelCollection,
    PaneviewReact,
    PaneviewApi,
    PaneviewReadyEvent,
    IPaneviewPanelProps,
} from 'dockview';
import * as React from 'react';
import { Story, Meta } from '@storybook/react';
import 'dockview/dist/styles.css';

const components: PanelCollection<IPaneviewPanelProps> = {
    default: (props) => {
        return (
            <div
                style={{
                    padding: '10px',
                    backgroundColor: props.color,
                    height: '100%',
                }}
            >
                hello world
            </div>
        );
    },
};

export const Simple = (props: { theme: string }) => {
    const api = React.useRef<PaneviewApi>();

    const onReady = (event: PaneviewReadyEvent) => {
        event.api.layout(window.innerWidth, window.innerHeight);
        api.current = event.api;

        event.api.addPanel({
            id: 'panel1',
            component: 'default',
            params: { color: 'red' },
            title: 'Panel1',
            minimumBodySize: 100,
        });
        event.api.addPanel({
            id: 'panel2',
            component: 'default',
            params: { color: 'green' },
            title: 'Panel 2',
            minimumBodySize: 100,
        });
        event.api.addPanel({
            id: 'panel3',
            component: 'default',
            params: { color: 'purple' },
            title: 'Panel 3',
            minimumBodySize: 100,
        });
    };

    React.useEffect(() => {
        window.addEventListener('resize', () => {
            api.current?.layout(window.innerWidth, window.innerHeight);
        });
    }, []);

    return (
        <PaneviewReact
            className={props.theme}
            onReady={onReady}
            components={components}
        />
    );
};

export default {
    title: 'Paneview',
    component: Simple,
    decorators: [
        (Component) => {
            document.body.style.padding = '0px';
            return (
                <div style={{ height: '100vh', fontFamily: 'Arial' }}>
                    <Component />
                </div>
            );
        },
    ],
    args: { theme: 'dockview-theme-light' },
    argTypes: {
        theme: {
            control: {
                type: 'select',
                options: ['dockview-theme-dark', 'dockview-theme-light'],
            },
        },
    },
} as Meta;