System.register(["react/jsx-runtime", "react", "react-easy-crop"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_easy_crop_1;
    var __moduleName = context_1 && context_1.id;
    function getCroppedImg(imageSrc, crop) {
        return new Promise((resolve) => {
            const image = new window.Image();
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const size = 400;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                ctx.save();
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);
                ctx.restore();
                canvas.toBlob((blob) => {
                    if (blob)
                        resolve(blob);
                }, 'image/jpeg', 0.9);
            };
            image.src = imageSrc;
        });
    }
    function WebAvatarCropper({ visible, imageUri, originalImageUri, onCropComplete, onCancel, onReplacePhoto, }) {
        const displayImageUri = originalImageUri || imageUri;
        const [crop, setCrop] = react_1.useState({ x: 0, y: 0 });
        const [zoom, setZoom] = react_1.useState(1);
        const [croppedAreaPixels, setCroppedAreaPixels] = react_1.useState(null);
        const [isSaving, setIsSaving] = react_1.useState(false);
        react_1.useEffect(() => {
            if (!visible) {
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setCroppedAreaPixels(null);
            }
        }, [visible]);
        const onCropChange = react_1.useCallback((newCrop) => {
            setCrop(newCrop);
        }, []);
        const onZoomChange = react_1.useCallback((newZoom) => {
            setZoom(newZoom);
        }, []);
        const onCropAreaComplete = react_1.useCallback((_croppedArea, croppedAreaPixels) => {
            setCroppedAreaPixels(croppedAreaPixels);
        }, []);
        const handleSave = async () => {
            if (!croppedAreaPixels)
                return;
            setIsSaving(true);
            try {
                const blob = await getCroppedImg(displayImageUri, croppedAreaPixels);
                onCropComplete(blob);
            }
            finally {
                setIsSaving(false);
            }
        };
        if (!visible)
            return null;
        return (_jsx("div", { style: {
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
            }, children: _jsxs("div", { style: {
                    backgroundColor: '#1a1a1a',
                    borderRadius: 16,
                    padding: '24px 28px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: 460,
                    width: 'auto',
                }, children: [_jsxs("div", { style: {
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20,
                        }, children: [_jsx("button", { onClick: onCancel, style: {
                                    background: 'none',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: 15,
                                    cursor: 'pointer',
                                    padding: 0,
                                    fontFamily: 'Inclusive Sans, sans-serif',
                                }, children: "Cancel" }), _jsx("span", { style: { color: '#fff', fontSize: 16, fontWeight: 600, fontFamily: 'Inclusive Sans, sans-serif' }, children: "Adjust profile photo" }), _jsxs("div", { style: { display: 'flex', gap: 16 }, children: [onReplacePhoto && (_jsx("button", { onClick: onReplacePhoto, style: {
                                            background: 'none',
                                            border: 'none',
                                            color: '#60A5FA',
                                            fontSize: 14,
                                            cursor: 'pointer',
                                            padding: 0,
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                        }, children: "Change" })), _jsx("button", { onClick: handleSave, disabled: isSaving, style: {
                                            background: 'none',
                                            border: 'none',
                                            color: isSaving ? '#666' : '#F97316',
                                            fontSize: 15,
                                            fontWeight: 600,
                                            cursor: isSaving ? 'not-allowed' : 'pointer',
                                            padding: 0,
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                        }, children: isSaving ? 'Saving...' : 'Done' })] })] }), _jsx("div", { style: { position: 'relative', width: 360, height: 360, borderRadius: 8, overflow: 'hidden' }, children: _jsx(react_easy_crop_1.default, { image: displayImageUri, crop: crop, zoom: zoom, aspect: 1, cropShape: "round", showGrid: false, onCropChange: onCropChange, onZoomChange: onZoomChange, onCropComplete: onCropAreaComplete }) }), _jsxs("div", { style: { width: '100%', marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }, children: [_jsx("span", { style: { color: '#9ca3af', fontSize: 12, fontFamily: 'Inclusive Sans, sans-serif' }, children: "Zoom" }), _jsx("input", { type: "range", min: 1, max: 3, step: 0.01, value: zoom, onChange: (e) => setZoom(parseFloat(e.target.value)), style: { flex: 1, accentColor: '#F97316' } })] }), _jsx("div", { style: {
                            marginTop: 12,
                            color: '#9ca3af',
                            fontSize: 13,
                            textAlign: 'center',
                            fontFamily: 'Inclusive Sans, sans-serif',
                        }, children: "Drag to reposition \u00B7 Scroll to zoom" })] }) }));
    }
    exports_1("default", WebAvatarCropper);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (react_easy_crop_1_1) {
                react_easy_crop_1 = react_easy_crop_1_1;
            }
        ],
        execute: function () {
        }
    };
});
