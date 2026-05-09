System.register(["vitest", "../../utils/addressParsing"], function (exports_1, context_1) {
    "use strict";
    var vitest_1, addressParsing_1;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (vitest_1_1) {
                vitest_1 = vitest_1_1;
            },
            function (addressParsing_1_1) {
                addressParsing_1 = addressParsing_1_1;
            }
        ],
        execute: function () {
            vitest_1.describe('extractCountryAndState', () => {
                vitest_1.it('parses US addresses with ST - ZIP, US', () => {
                    vitest_1.expect(addressParsing_1.extractCountryAndState('3511 Pontius Ct, Ijamsville, MD - 21754, US')).toEqual({
                        country: 'United States',
                        state: 'Maryland',
                    });
                    vitest_1.expect(addressParsing_1.extractCountryAndState('Chinmaya Mission NW Arkansas, 4000 SW Banbury Dr, Bentonville, AR - 72712, US')).toEqual({
                        country: 'United States',
                        state: 'Arkansas',
                    });
                    vitest_1.expect(addressParsing_1.extractCountryAndState('325 S El Dorado, MESA, AZ - 85202, US')).toEqual({
                        country: 'United States',
                        state: 'Arizona',
                    });
                });
                vitest_1.it('treats Canada country code CA as Canada when province is Canadian', () => {
                    vitest_1.expect(addressParsing_1.extractCountryAndState('8 Seasons Dr, Toronto, ON - M1X 1X4, CA')).toEqual({ country: 'Canada', state: 'Ontario' });
                });
                vitest_1.it('treats Canada country code CA as US California when last segment is CA', () => {
                    vitest_1.expect(addressParsing_1.extractCountryAndState('10160 Clayton Rd, San Jose, CA')).toEqual({
                        country: 'United States',
                        state: 'California',
                    });
                });
                vitest_1.it('groups Canadian centers with wrong , US suffix', () => {
                    vitest_1.expect(addressParsing_1.extractCountryAndState('155 E 54th Ave, Vancouver, BC - V5X 1K7, US')).toEqual({
                        country: 'Canada',
                        state: 'British Columbia',
                    });
                    vitest_1.expect(addressParsing_1.extractCountryAndState('1088 Ogilvie Rd, Ottawa, ON - K1J 7P8, US')).toEqual({
                        country: 'Canada',
                        state: 'Ontario',
                    });
                });
                vitest_1.it('parses Canadian ON postal without country suffix', () => {
                    vitest_1.expect(addressParsing_1.extractCountryAndState('917-B Nippissing Road, Milton, ON L9T 5E3')).toEqual({
                        country: 'Canada',
                        state: 'Ontario',
                    });
                });
                vitest_1.it('parses US WA 98033, US', () => {
                    vitest_1.expect(addressParsing_1.extractCountryAndState('7525 132nd avenue NE, Kirkland, WA 98033, US')).toEqual({
                        country: 'United States',
                        state: 'Washington',
                    });
                });
                vitest_1.it('parses CO with empty zip and lowercase co (prod Trinidad / Colorado examples)', () => {
                    vitest_1.expect(addressParsing_1.extractCountryAndState('#1 Swami Chinmayananada Dr., Calcutta Rd #1, McBean, CO - , US')).toEqual({ country: 'United States', state: 'Colorado' });
                    vitest_1.expect(addressParsing_1.extractCountryAndState('Rd #1 Mc Bean Couva, Couva, Co - 01234, US')).toEqual({
                        country: 'United States',
                        state: 'Colorado',
                    });
                });
                vitest_1.it('merges Trinidad seed centers into one Colorado section label', () => {
                    const a = addressParsing_1.centerGroupLabel('#1 Swami Chinmayananada Dr., Calcutta Rd #1, McBean, CO - , US');
                    const b = addressParsing_1.centerGroupLabel('Rd #1 Mc Bean Couva, Couva, Co - 01234, US');
                    vitest_1.expect(a).toBe('Colorado');
                    vitest_1.expect(b).toBe('Colorado');
                    vitest_1.expect(a).toBe(b);
                });
                vitest_1.it('normalizes lowercase country code', () => {
                    vitest_1.expect(addressParsing_1.extractCountryAndState('8 Seasons Dr, Toronto, ON - M1X 1X4, ca')).toEqual({
                        country: 'Canada',
                        state: 'Ontario',
                    });
                    vitest_1.expect(addressParsing_1.extractCountryAndState('325 S El Dorado, MESA, AZ - 85202, us')).toEqual({
                        country: 'United States',
                        state: 'Arizona',
                    });
                });
            });
        }
    };
});
