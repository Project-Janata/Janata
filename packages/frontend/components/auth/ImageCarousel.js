System.register(["react/jsx-runtime", "react", "../ui/Logo"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, Logo_1;
    var __moduleName = context_1 && context_1.id;
    function resolveImageSrc(image) {
        if (!image)
            return '';
        if (typeof image === 'string')
            return image;
        if (typeof image === 'object') {
            if (typeof image.default === 'string')
                return image.default;
            if (typeof image.uri === 'string')
                return image.uri;
        }
        return '';
    }
    function shuffleArray(arr) {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    function ImageCarousel({ images, interval = 15000 }) {
        const [shuffledImages] = react_1.useState(() => shuffleArray(images.map(resolveImageSrc).filter((src) => src.length > 0)));
        const [activeIndex, setActiveIndex] = react_1.useState(() => shuffledImages.length > 0 ? Math.floor(Math.random() * shuffledImages.length) : 0);
        const [showFirst, setShowFirst] = react_1.useState(true);
        const prevIndexRef = react_1.useRef(activeIndex);
        react_1.useEffect(() => {
            if (shuffledImages.length <= 1)
                return;
            const id = setInterval(() => {
                setActiveIndex((prev) => {
                    prevIndexRef.current = prev;
                    return (prev + 1) % shuffledImages.length;
                });
                setShowFirst((prev) => !prev);
            }, interval);
            return () => clearInterval(id);
        }, [shuffledImages.length, interval]);
        // Determine which image each slot shows
        const firstSlotIndex = showFirst ? activeIndex : prevIndexRef.current;
        const secondSlotIndex = showFirst ? prevIndexRef.current : activeIndex;
        // Empty state
        if (shuffledImages.length === 0) {
            return (_jsxs("div", { style: {
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, #F4DED7 0%, #E7D5CC 100%)',
                }, children: [_jsx("div", { style: {
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            opacity: 0.08,
                        }, children: _jsx(Logo_1.default, { size: 200, showText: false }) }), _jsx("div", { style: {
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: 200,
                            background: 'linear-gradient(to top, rgba(28,25,23,0.5) 0%, rgba(28,25,23,0.15) 50%, transparent 100%)',
                        } }), _jsx("div", { style: { position: 'absolute', bottom: 32, left: 32 }, children: _jsx(Logo_1.default, { size: 24, color: "#FFFFFF" }) })] }));
        }
        return (_jsxs("div", { style: {
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
            }, children: [_jsx("img", { src: shuffledImages[firstSlotIndex], alt: "", loading: "eager", decoding: "async", width: 800, height: 1200, style: {
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: showFirst ? 1 : 0,
                        transition: 'opacity 1s ease-in-out',
                    } }), _jsx("img", { src: shuffledImages[secondSlotIndex], alt: "", loading: "lazy", decoding: "async", width: 800, height: 1200, style: {
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: showFirst ? 0 : 1,
                        transition: 'opacity 1s ease-in-out',
                    } }), _jsx("div", { style: {
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: 200,
                        background: 'linear-gradient(to top, rgba(28,25,23,0.5) 0%, rgba(28,25,23,0.15) 50%, transparent 100%)',
                    } }), _jsx("div", { style: { position: 'absolute', bottom: 32, left: 32 }, children: _jsx(Logo_1.default, { size: 24, color: "#FFFFFF" }) })] }));
    }
    exports_1("ImageCarousel", ImageCarousel);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (Logo_1_1) {
                Logo_1 = Logo_1_1;
            }
        ],
        execute: function () {
        }
    };
});
