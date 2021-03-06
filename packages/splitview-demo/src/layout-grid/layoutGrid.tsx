import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
    IDockviewPanelProps,
    CompositeDisposable,
    GroupChangeKind,
    IGridviewPanelProps,
    TabContextMenuEvent,
    DockviewReadyEvent,
    DockviewReact,
    DockviewApi,
    IWatermarkPanelProps,
    IGroupPanel,
    PanelCollection,
} from 'dockview';
import { CustomTab } from './customTab';
import { Settings } from './settingsPanel';
import { useLayoutRegistry } from './registry';
import { SplitPanel } from './splitPanel';
import './layoutGrid.scss';
import { WelcomePanel } from '../panels/welcome/welcome';
import { SplitviewPanel } from '../panels/splitview/splitview';
import { GridviewDemoPanel } from '../panels/gridview/gridview';

const components: PanelCollection<IDockviewPanelProps> = {
    welcome: WelcomePanel,
    splitview: SplitviewPanel,
    gridview: GridviewDemoPanel,
    inner_component: (props: IDockviewPanelProps) => {
        const _api = React.useRef<DockviewApi>();

        const onReady = (event: DockviewReadyEvent) => {
            _api.current = event.api;

            const layout = props.api.getStateKey<any>('layout');
            if (layout) {
                event.api.fromJSON(layout);
            } else {
                event.api.addPanel({
                    component: 'test_component',
                    id: 'inner-1',
                    title: 'inner-1',
                });
                event.api.addPanel({
                    component: 'test_component',
                    id: 'inner-2',
                    title: 'inner-2',
                });
                event.api.addPanel({
                    component: 'test_component',
                    id: nextGuid(),
                    title: 'inner-3',
                    position: {
                        direction: 'within',
                        referencePanel: 'inner-1',
                    },
                });
                event.api.addPanel({
                    component: 'test_component',
                    id: nextGuid(),
                    title: 'inner-4',
                    position: {
                        direction: 'within',
                        referencePanel: 'inner-2',
                    },
                });
            }
        };

        React.useEffect(() => {
            const compDis = new CompositeDisposable(
                props.api.onDidDimensionsChange((event) => {
                    // _api.current?.layout(event.width, event.height);
                }),
                _api.current.onGridEvent((event) => {
                    if (event.kind === GroupChangeKind.LAYOUT_CONFIG_UPDATED) {
                        props.api.setState('layout', _api.current.toJSON());
                    }
                })
            );

            return () => {
                compDis.dispose();
            };
        }, []);

        return (
            <div
                style={{
                    boxSizing: 'border-box',
                    // borderTop: "1px solid var(--dv-separator-border)",
                }}
            >
                <DockviewReact
                    onReady={onReady}
                    components={components}
                    tabHeight={20}
                    debug={true}
                />
            </div>
        );
    },
    test_component: (props: IDockviewPanelProps & { [key: string]: any }) => {
        const [panelState, setPanelState] = React.useState<{
            isGroupActive: boolean;
            isPanelVisible: boolean;
        }>({
            isGroupActive: false,
            isPanelVisible: false,
        });

        const input = React.useRef<HTMLInputElement>();

        React.useEffect(() => {
            props.setActionsbar(
                (_props) => {
                    const onClick = () => {
                        _props.api.close();
                    };

                    return (
                        <div
                            style={{
                                height: '100%',
                                display: 'flex',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                padding: '0px 4px',
                            }}
                        >
                            <span
                                onClick={onClick}
                                style={{
                                    height: '100%',
                                    width: '25px',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <a className="material-icons">menu</a>
                            </span>
                        </div>
                    );
                },
                { qwerty: 'qwerty' }
            );
        }, []);

        React.useEffect(() => {
            const disposable = new CompositeDisposable(
                props.api.onDidActiveChange((event) => {
                    setPanelState((_) => ({
                        ..._,
                        isGroupActive: event.isActive,
                    }));
                }),
                props.api.onDidVisibilityChange((x) => {
                    setPanelState((_) => ({
                        ..._,
                        isPanelVisible: x.isVisible,
                    }));
                }),
                props.api.onFocusEvent(() => {
                    input.current.focus();
                })
            );

            props.api.interceptOnCloseAction(() => {
                if (confirm('close?')) {
                    return Promise.resolve(true);
                }
                return Promise.resolve(false);
            });

            return () => {
                disposable.dispose();
            };
        }, []);

        const onClick = () => {
            props.api.setState('test_key', 'hello');
        };

        const backgroundColor = React.useMemo(
            () =>
                // "#1e1e1e",
                `rgb(${Math.floor(Math.random() * 256)},${Math.floor(
                    Math.random() * 256
                )},${Math.floor(Math.random() * 256)})`,
            []
        );

        const onRename = () => {
            props.api.setTitle('Did it change?');
        };

        return (
            <div
                style={{
                    // backgroundColor,
                    height: '100%',
                }}
            >
                <div
                    style={{
                        padding: '5px',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div>This is a dockable panel</div>
                    <div>
                        <span>{'isGroupActive: '}</span>
                        <span
                            style={{
                                color: panelState.isGroupActive
                                    ? '#23d16f'
                                    : '#cd312b',
                            }}
                        >
                            {`${panelState.isGroupActive}`}
                        </span>
                    </div>
                    <div>
                        <span>{'isPanelVisible: '}</span>
                        <span
                            style={{
                                color: panelState.isPanelVisible
                                    ? '#23d16f'
                                    : '#cd312b',
                            }}
                        >
                            {`${panelState.isPanelVisible}`}
                        </span>
                    </div>
                    <button onClick={onClick}>set state</button>
                    <button onClick={onRename}>rename</button>

                    {/* {props.api.getState()["test_key"]} */}

                    {/* <div>{props.text || '-'}</div> */}
                    <input
                        style={{ width: '175px' }}
                        ref={input}
                        placeholder="This is focused by the panel"
                    />
                    <input
                        style={{ width: '175px' }}
                        placeholder="This is also focusable"
                    />
                </div>
            </div>
        );
    },
    settings: Settings,
    split_panel: SplitPanel,
};

const tabComponents = {
    default: CustomTab,
};

export const nextGuid = (() => {
    let counter = 0;
    return () => 'panel_' + (counter++).toString();
})();

export const TestGrid = (props: IGridviewPanelProps) => {
    const _api = React.useRef<DockviewApi>();
    const registry = useLayoutRegistry();

    const onReady = (event: DockviewReadyEvent) => {
        const api = event.api;
        _api.current = event.api;
        registry.register('dockview', api);

        api.addDndHandle('text/plain', (ev) => {
            const { event } = ev;

            return {
                id: 'yellow',
                component: 'test_component',
            };
        });

        api.addDndHandle('Files', (ev) => {
            const { event } = ev;

            ev.event.event.preventDefault();

            return {
                id: Date.now().toString(),
                title: event.event.dataTransfer.files[0].name,
                component: 'test_component',
            };
        });

        const state = localStorage.getItem('dockview');
        if (state) {
            api.fromJSON(JSON.parse(state));
        } else {
            api.addPanel({
                component: 'welcome',
                id: 'welcome',
                title: 'Welcome',
            });

            // event.api.deserialize(require('./layoutGrid.layout.json'));
            return;

            api.addPanel({
                component: 'test_component',
                id: nextGuid(),
                title: 'Item 1',
                params: { text: 'how low?' },
            });
            api.addPanel({
                component: 'test_component',
                id: 'item2',
                title: 'Item 2',
            });
            api.addPanel({
                component: 'split_panel',
                id: nextGuid(),
                title: 'Item 3 with a long title',
            });
            api.addPanel({
                component: 'test_component',
                id: nextGuid(),
                title: 'Item 3',
                position: { direction: 'below', referencePanel: 'item2' },
                suppressClosable: true,
            });
        }
    };

    React.useEffect(() => {
        props.api.setConstraints({
            minimumWidth: () => _api.current.minimumWidth,
            minimumHeight: () => _api.current.minimumHeight,
        });

        const disposable = new CompositeDisposable(
            _api.current.onDidLayoutChange(() => {
                const state = _api.current.toJSON();
                localStorage.setItem('dockview', JSON.stringify(state));
            }),
            props.api.onDidDimensionsChange((event) => {
                const { width, height } = event;
                // _api.current.layout(width, height);
            })
        );

        return () => {
            disposable.dispose();
        };
    }, []);

    const [coord, setCoord] = React.useState<{
        x: number;
        y: number;
        panel: IGroupPanel;
    }>(undefined);

    const onTabContextMenu = React.useMemo(
        () => (event: TabContextMenuEvent) => {
            event.event.preventDefault();
            console.log(event.panel);
            const cb = (event: MouseEvent) => {
                let element: HTMLElement = event.target as HTMLElement;

                while (element) {
                    if (element.classList.contains('context-menu')) {
                        return;
                    }
                    element = element.parentElement;
                }

                window.removeEventListener('mousedown', cb);
                setCoord(undefined);
            };
            window.addEventListener('mousedown', cb);
            setCoord({
                x: event.event.clientX,
                y: event.event.clientY,
                panel: event.panel,
            });
        },
        []
    );

    const onClose = () => {
        setCoord(undefined);
        coord.panel.api.close();
    };

    const onChangeName = () => {
        setCoord(undefined);
        coord.panel.api.setTitle('This looks new?');
    };

    return (
        <>
            {coord &&
                ReactDOM.createPortal(
                    <div
                        className="context-menu"
                        style={{
                            left: `${coord.x}px`,
                            top: `${coord.y}px`,
                        }}
                    >
                        <div className="context-action" onClick={onClose}>
                            Close
                        </div>
                        <div className="context-action" onClick={onChangeName}>
                            Rename
                        </div>
                    </div>,
                    document.getElementById('anchor')
                )}
            <DockviewReact
                onReady={onReady}
                components={components}
                tabComponents={tabComponents}
                debug={false}
                enableExternalDragEvents={true}
                onTabContextMenu={onTabContextMenu}
                watermarkComponent={Watermark}
            />
        </>
    );
};

const Watermark = (props: IWatermarkPanelProps) => {
    const [groups, setGroups] = React.useState<number>(props.containerApi.size);
    React.useEffect(() => {
        console.log('mount');
        const disposable = new CompositeDisposable(
            props.containerApi.onDidLayoutChange(() => {
                console.log(`groups2 ${props.containerApi.size}`);
                setGroups(props.containerApi.size);
            })
        );

        return () => {
            console.log('unmount');
            disposable.dispose();
        };
    }, []);

    const onClick = () => {
        props.close();
    };

    return (
        <div
            style={{
                display: 'flex',
                width: '100%',
                flexGrow: 1,
                height: '100%',
                flexDirection: 'column',
            }}
        >
            <div
                style={{
                    height: '35px',
                    display: 'flex',
                    width: '100%',
                }}
            >
                <span style={{ flexGrow: 1 }} />
                {groups > 1 && (
                    <span
                        onClick={onClick}
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <a className="close-action"></a>
                    </span>
                )}
            </div>
            <div
                style={{
                    flexGrow: 1,
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                {/* <svg
                    width="300"
                    height="300"
                    viewBox="0 0 300 300"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect
                        x="12.5"
                        y="12.5"
                        width="175"
                        height="275"
                        stroke="black"
                        stroke-width="25"
                    />
                    <rect
                        x="112.5"
                        y="62.5"
                        width="175"
                        height="175"
                        stroke="black"
                        stroke-width="25"
                    />
                </svg> */}
            </div>
        </div>
    );
};
