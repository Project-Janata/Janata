System.register(["react/jsx-runtime", "react-map-gl/maplibre", "maplibre-gl/dist/maplibre-gl.css"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, maplibre_1;
    var __moduleName = context_1 && context_1.id;
    function MaplibreView({ mapRef, viewState, onMove, mapStyle, markers, }) {
        return (_jsxs(maplibre_1.default, { ref: mapRef, ...viewState, onMove: onMove, mapStyle: mapStyle, style: { width: '100%', height: '100%' }, reuseMaps: true, attributionControl: false, cooperativeGestures: true, children: [markers.map(({ point, onClick }) => (_jsx(maplibre_1.Marker, { longitude: point.longitude, latitude: point.latitude, anchor: "bottom", onClick: onClick, children: _jsx("div", { className: `w-[30px] h-[30px] rounded-[50%_50%_50%_0] -rotate-45 border-2 border-white shadow-[0_2px_4px_rgba(0,0,0,0.3)] cursor-pointer
              ${point.type === 'center' ? 'bg-red-500' : 'bg-blue-500'}`, title: point.name }) }, point.id))), _jsx(maplibre_1.AttributionControl, { compact: true, position: "bottom-left", style: {
                        marginBottom: '10px',
                        marginLeft: '10px',
                    } })] }));
    }
    exports_1("default", MaplibreView);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (maplibre_1_1) {
                maplibre_1 = maplibre_1_1;
            },
            function (_1) {
            }
        ],
        execute: function () {
        }
    };
});
