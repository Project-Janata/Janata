System.register(["vitest"], function (exports_1, context_1) {
    "use strict";
    var vitest_1, geolocationMock;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (vitest_1_1) {
                vitest_1 = vitest_1_1;
            }
        ],
        execute: function () {
            // Mock geolocation before importing
            geolocationMock = {
                getCurrentPosition: vitest_1.vi.fn(),
                watchPosition: vitest_1.vi.fn(),
                clearWatch: vitest_1.vi.fn(),
            };
            vitest_1.vi.stubGlobal('navigator', {
                geolocation: geolocationMock,
            });
            vitest_1.describe('getLocationAccess', () => {
                vitest_1.it('should return true for web platform', async () => {
                    const { getLocationAccess } = await context_1.import('../../utils/locationServices');
                    const result = await getLocationAccess();
                    vitest_1.expect(result).toBe(true);
                });
            });
            vitest_1.describe('getCurrentPosition', () => {
                vitest_1.it('should return coordinates from browser geolocation API', async () => {
                    const mockPosition = {
                        coords: {
                            latitude: 37.7749,
                            longitude: -122.4194,
                        },
                    };
                    geolocationMock.getCurrentPosition.mockImplementation((callback) => {
                        callback(mockPosition);
                    });
                    const { getCurrentPosition } = await context_1.import('../../utils/locationServices');
                    const result = await getCurrentPosition();
                    vitest_1.expect(result).toEqual([-122.4194, 37.7749]);
                    vitest_1.expect(geolocationMock.getCurrentPosition).toHaveBeenCalled();
                });
                vitest_1.it('should return default location on error', async () => {
                    geolocationMock.getCurrentPosition.mockImplementation((_, errorCallback) => {
                        errorCallback(new Error('Permission denied'));
                    });
                    const { getCurrentPosition } = await context_1.import('../../utils/locationServices');
                    const result = await getCurrentPosition();
                    // Returns empty array so callers can apply their own fallback
                    vitest_1.expect(result).toEqual([]);
                });
                vitest_1.it('should return empty array when geolocation is not available', async () => {
                    vitest_1.vi.stubGlobal('navigator', {
                        geolocation: undefined,
                    });
                    const { getCurrentPosition } = await context_1.import('../../utils/locationServices');
                    const result = await getCurrentPosition();
                    // Returns empty array so callers can apply their own fallback
                    vitest_1.expect(result).toEqual([]);
                });
            });
        }
    };
});
