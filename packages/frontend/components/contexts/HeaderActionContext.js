System.register(["react/jsx-runtime", "react"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, Context;
    var __moduleName = context_1 && context_1.id;
    function HeaderActionProvider({ children }) {
        const handlerRef = react_1.useRef(null);
        const setCreateHandler = react_1.useCallback((h) => {
            handlerRef.current = h;
        }, []);
        const triggerCreate = react_1.useCallback(() => {
            handlerRef.current?.();
        }, []);
        return (_jsx(Context.Provider, { value: { setCreateHandler, triggerCreate }, children: children }));
    }
    exports_1("HeaderActionProvider", HeaderActionProvider);
    function useHeaderAction() {
        return react_1.useContext(Context);
    }
    exports_1("useHeaderAction", useHeaderAction);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            }
        ],
        execute: function () {
            Context = react_1.createContext({
                setCreateHandler: () => { },
                triggerCreate: () => { },
            });
        }
    };
});
