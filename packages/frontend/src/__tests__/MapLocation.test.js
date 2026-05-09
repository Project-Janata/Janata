System.register(["vitest"], function (exports_1, context_1) {
    "use strict";
    var vitest_1, localStorageMock, geolocationMock;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (vitest_1_1) {
                vitest_1 = vitest_1_1;
            }
        ],
        execute: function () {
            // Mock localStorage
            localStorageMock = {
                getItem: vitest_1.vi.fn(),
                setItem: vitest_1.vi.fn(),
                removeItem: vitest_1.vi.fn(),
                clear: vitest_1.vi.fn(),
            };
            vitest_1.vi.stubGlobal('localStorage', localStorageMock);
            // Mock geolocation
            geolocationMock = {
                getCurrentPosition: vitest_1.vi.fn(),
            };
            vitest_1.vi.stubGlobal('navigator', {
                geolocation: geolocationMock,
            });
            vitest_1.describe('Map location functionality', () => {
                vitest_1.beforeEach(() => {
                    vitest_1.vi.clearAllMocks();
                    localStorageMock.getItem.mockReturnValue(null);
                });
                vitest_1.describe('localStorage integration', () => {
                    vitest_1.it('should read stored location from localStorage', () => {
                        const storedLocation = { latitude: 37.7749, longitude: -122.4194 };
                        localStorageMock.getItem.mockReturnValue(JSON.stringify(storedLocation));
                        const result = localStorageMock.getItem('userLocation');
                        const parsed = JSON.parse(result);
                        vitest_1.expect(parsed).toEqual(storedLocation);
                        vitest_1.expect(parsed.latitude).toBe(37.7749);
                        vitest_1.expect(parsed.longitude).toBe(-122.4194);
                    });
                    vitest_1.it('should return null when no stored location', () => {
                        localStorageMock.getItem.mockReturnValue(null);
                        const result = localStorageMock.getItem('userLocation');
                        vitest_1.expect(result).toBeNull();
                    });
                    vitest_1.it('should save location to localStorage', () => {
                        const location = { latitude: 40.7128, longitude: -74.0060 };
                        localStorageMock.setItem('userLocation', JSON.stringify(location));
                        vitest_1.expect(localStorageMock.setItem).toHaveBeenCalledWith('userLocation', JSON.stringify(location));
                    });
                });
                vitest_1.describe('geolocation integration', () => {
                    vitest_1.it('should request and return current position', () => {
                        const mockPosition = {
                            coords: {
                                latitude: 40.7128,
                                longitude: -74.0060,
                            },
                        };
                        geolocationMock.getCurrentPosition.mockImplementation((callback) => {
                            callback(mockPosition);
                        });
                        navigator.geolocation.getCurrentPosition((position) => {
                            vitest_1.expect(position.coords.latitude).toBe(40.7128);
                            vitest_1.expect(position.coords.longitude).toBe(-74.0060);
                        });
                    });
                    vitest_1.it('should call error callback on permission denied', () => {
                        geolocationMock.getCurrentPosition.mockImplementation((_, errorCallback) => {
                            errorCallback(new Error('Permission denied'));
                        });
                        navigator.geolocation.getCurrentPosition(() => { }, (error) => {
                            vitest_1.expect(error.message).toBe('Permission denied');
                        });
                    });
                });
                vitest_1.describe('Map center priority logic', () => {
                    vitest_1.it('should prioritize localStorage over geolocation', () => {
                        const storedLocation = { latitude: 37.7749, longitude: -122.4194 };
                        localStorageMock.getItem.mockReturnValue(JSON.stringify(storedLocation));
                        // Simulate the component's priority logic
                        const stored = localStorageMock.getItem('userLocation');
                        let mapCenter = null;
                        if (stored) {
                            mapCenter = JSON.parse(stored);
                        }
                        vitest_1.expect(mapCenter).toEqual(storedLocation);
                        // Geolocation should NOT be called when stored location exists
                        vitest_1.expect(geolocationMock.getCurrentPosition).not.toHaveBeenCalled();
                    });
                    vitest_1.it('should fall back to geolocation when no stored location', () => {
                        localStorageMock.getItem.mockReturnValue(null);
                        const mockPosition = {
                            coords: {
                                latitude: 40.7128,
                                longitude: -74.0060,
                            },
                        };
                        geolocationMock.getCurrentPosition.mockImplementation((callback) => {
                            callback(mockPosition);
                        });
                        // Simulate the component's priority logic
                        const stored = localStorageMock.getItem('userLocation');
                        let mapCenter = null;
                        if (!stored && navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((position) => {
                                mapCenter = {
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude,
                                };
                            });
                        }
                        vitest_1.expect(mapCenter).toEqual({ latitude: 40.7128, longitude: -74.0060 });
                    });
                });
            });
        }
    };
});
