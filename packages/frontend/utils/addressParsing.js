/**
 * Address parsing for center list grouping and display.
 * Handles US "ST - ZIP, US", Canadian provinces/postal codes, and the CA ambiguity
 * (Canada country code vs US California).
 */
System.register([], function (exports_1, context_1) {
    "use strict";
    var US_STATES, CANADA_PROVINCE_NAMES, CAN_POSTAL;
    var __moduleName = context_1 && context_1.id;
    function tryParseCanada(parts) {
        const lastRaw = parts[parts.length - 1]?.trim() ?? '';
        const last = lastRaw.toUpperCase();
        const joined = parts.join(' ');
        const hasCanadianPostal = CAN_POSTAL.test(joined);
        for (const raw of parts) {
            const seg = raw.trim();
            const dash = seg.match(/^([A-Z]{2})\s*-\s*(.*)$/i);
            if (dash) {
                const code = dash[1].toUpperCase();
                // Province codes do not overlap US state codes (CA is US; Canada uses country "CA").
                if (CANADA_PROVINCE_NAMES[code]) {
                    return { country: 'Canada', state: CANADA_PROVINCE_NAMES[code] };
                }
            }
            const spacePostal = seg.match(/^([A-Z]{2})\s+([A-Z]\d[A-Z]\s?\d[A-Z]\d)$/i);
            if (spacePostal && CANADA_PROVINCE_NAMES[spacePostal[1].toUpperCase()]) {
                return { country: 'Canada', state: CANADA_PROVINCE_NAMES[spacePostal[1].toUpperCase()] };
            }
        }
        if (last === 'CA' || last === 'CAN' || last === 'CANADA') {
            if (parts.length >= 2) {
                const prev = parts[parts.length - 2].trim();
                const d = prev.match(/^([A-Z]{2})\s*-\s*(.*)$/i);
                if (d && CANADA_PROVINCE_NAMES[d[1].toUpperCase()]) {
                    return { country: 'Canada', state: CANADA_PROVINCE_NAMES[d[1].toUpperCase()] };
                }
                if (/^[A-Z]{2}$/i.test(prev)) {
                    const code = prev.toUpperCase();
                    if (CANADA_PROVINCE_NAMES[code]) {
                        return { country: 'Canada', state: CANADA_PROVINCE_NAMES[code] };
                    }
                }
            }
            if (hasCanadianPostal) {
                for (const raw of parts) {
                    const d = raw.trim().match(/^([A-Z]{2})\s*-\s*/i);
                    if (d && CANADA_PROVINCE_NAMES[d[1].toUpperCase()]) {
                        return { country: 'Canada', state: CANADA_PROVINCE_NAMES[d[1].toUpperCase()] };
                    }
                }
            }
        }
        if (last === 'US' || last === 'USA' || last === 'UNITED STATES') {
            for (const raw of parts) {
                const seg = raw.trim();
                const dash = seg.match(/^([A-Z]{2})\s*-\s*(.*)$/i);
                if (dash && CANADA_PROVINCE_NAMES[dash[1].toUpperCase()]) {
                    return { country: 'Canada', state: CANADA_PROVINCE_NAMES[dash[1].toUpperCase()] };
                }
            }
            if (hasCanadianPostal) {
                for (const raw of parts) {
                    const m = raw.trim().match(/^([A-Z]{2})\s+([A-Z]\d[A-Z]\s?\d[A-Z]\d)$/i);
                    if (m && CANADA_PROVINCE_NAMES[m[1].toUpperCase()]) {
                        return { country: 'Canada', state: CANADA_PROVINCE_NAMES[m[1].toUpperCase()] };
                    }
                }
            }
        }
        return null;
    }
    function parseUsStateFromRegionSegment(region) {
        const t = region.trim();
        let m = t.match(/^([A-Za-z]{2})\s+(\d{5})(?:-\d{4})?$/i);
        if (m && US_STATES[m[1].toUpperCase()]) {
            return US_STATES[m[1].toUpperCase()];
        }
        m = t.match(/^([A-Za-z]{2})\s*-\s*(\d{5})(?:-\d{4})?$/i);
        if (m && US_STATES[m[1].toUpperCase()]) {
            return US_STATES[m[1].toUpperCase()];
        }
        m = t.match(/^([A-Za-z]{2})\s*-\s*$/i);
        if (m && US_STATES[m[1].toUpperCase()]) {
            return US_STATES[m[1].toUpperCase()];
        }
        if (/^[A-Za-z]{2}$/i.test(t) && US_STATES[t.toUpperCase()]) {
            return US_STATES[t.toUpperCase()];
        }
        const stateEntry = Object.entries(US_STATES).find(([, name]) => name.toLowerCase() === t.toLowerCase());
        if (stateEntry) {
            return stateEntry[1];
        }
        return null;
    }
    /**
     * Returns normalized country and region for grouping discover centers.
     */
    function extractCountryAndState(address) {
        const fallback = { country: 'Other', state: 'Unknown' };
        if (!address)
            return fallback;
        const parts = address.split(',').map((s) => s.trim()).filter(Boolean);
        if (parts.length < 2)
            return fallback;
        const canada = tryParseCanada(parts);
        if (canada)
            return canada;
        const lastRaw = parts[parts.length - 1];
        const last = lastRaw.toUpperCase();
        if (last === 'US' || last === 'USA' || last === 'UNITED STATES') {
            if (parts.length >= 2) {
                const region = parts[parts.length - 2];
                const usState = parseUsStateFromRegionSegment(region);
                if (usState)
                    return { country: 'United States', state: usState };
            }
        }
        const stateZipMatch = lastRaw.match(/^([A-Za-z]{2})\s+\d{5}/);
        if (stateZipMatch) {
            const abbr = stateZipMatch[1].toUpperCase();
            return { country: 'United States', state: US_STATES[abbr] || abbr };
        }
        const usDash = lastRaw.match(/^([A-Za-z]{2})\s*-\s*(\d{5})(?:-\d{4})?$/i);
        if (usDash && US_STATES[usDash[1].toUpperCase()]) {
            return { country: 'United States', state: US_STATES[usDash[1].toUpperCase()] };
        }
        if (/^[A-Za-z]{2}$/.test(lastRaw.trim()) && US_STATES[lastRaw.trim().toUpperCase()]) {
            const abbr = lastRaw.trim().toUpperCase();
            return { country: 'United States', state: US_STATES[abbr] };
        }
        const stateEntry = Object.entries(US_STATES).find(([, name]) => name.toLowerCase() === lastRaw.toLowerCase());
        if (stateEntry) {
            return { country: 'United States', state: stateEntry[1] };
        }
        const statePart = parts.length >= 3 ? parts[parts.length - 2] : 'Unknown';
        const cleanState = statePart.replace(/\s*\d{5,6}(-\d{4})?$/, '').trim();
        return { country: lastRaw, state: cleanState || 'Unknown' };
    }
    exports_1("extractCountryAndState", extractCountryAndState);
    /** Same section key as Discover center grouping (for tests and tooling). */
    function centerGroupLabel(address) {
        const { country, state } = extractCountryAndState(address);
        if (country === 'Other' || state === 'Unknown')
            return 'Other';
        if (country === 'United States')
            return state;
        return `${state}, ${country}`;
    }
    exports_1("centerGroupLabel", centerGroupLabel);
    /**
     * Returns the discover list subtitle: "City, ST" for US centers, or
     * "City, ST, Country" / "City, Country" for everywhere else.
     *
     *   Phoenix US      -> "MESA, AZ"
     *   Calgary CA      -> "Calgary, AB, Canada"
     *   Redlands US     -> "Redlands, CA"  (3-segment "City, CA, US")
     *   San Jose US     -> "San Jose, CA"  (3-segment "City, CA")
     *   Couva TT        -> "Couva, Trinidad and Tobago"
     */
    function extractCityState(address) {
        if (!address)
            return null;
        const parts = address.split(',').map((s) => s.trim()).filter(Boolean);
        if (parts.length < 2)
            return null;
        const { country, state } = extractCountryAndState(address);
        const usAbbr = Object.entries(US_STATES).find(([, n]) => n === state)?.[0];
        const caAbbr = Object.entries(CANADA_PROVINCE_NAMES).find(([, n]) => n === state)?.[0];
        const stateAbbr = usAbbr || caAbbr;
        // Recognized US state or Canadian province: locate the segment starting
        // with that abbreviation; the segment before it is the city.
        if (stateAbbr) {
            const re = new RegExp(`^${stateAbbr}([\\s\\-]|$)`, 'i');
            for (let i = parts.length - 1; i >= 0; i--) {
                if (re.test(parts[i]) && i > 0) {
                    const city = parts[i - 1];
                    if (country === 'Canada')
                        return `${city}, ${stateAbbr}, Canada`;
                    return `${city}, ${stateAbbr}`;
                }
            }
        }
        // Non-US, non-Canada (or unparseable state). Show "City, Country" by
        // finding the country token and using the segment before it as the city.
        const countryTokens = new Set(['US', 'USA', 'UNITED STATES', 'CA', 'CAN', 'CANADA', 'TT']);
        for (let i = parts.length - 1; i >= 0; i--) {
            if (countryTokens.has(parts[i].toUpperCase()) && i > 0) {
                const city = parts[i - 1];
                const countryName = country === 'TT' ? 'Trinidad and Tobago' : country;
                if (country === 'United States' || country === 'Other')
                    return city;
                return `${city}, ${countryName}`;
            }
        }
        return null;
    }
    exports_1("extractCityState", extractCityState);
    return {
        setters: [],
        execute: function () {
            exports_1("US_STATES", US_STATES = {
                AL: 'Alabama',
                AK: 'Alaska',
                AZ: 'Arizona',
                AR: 'Arkansas',
                CA: 'California',
                CO: 'Colorado',
                CT: 'Connecticut',
                DE: 'Delaware',
                FL: 'Florida',
                GA: 'Georgia',
                HI: 'Hawaii',
                ID: 'Idaho',
                IL: 'Illinois',
                IN: 'Indiana',
                IA: 'Iowa',
                KS: 'Kansas',
                KY: 'Kentucky',
                LA: 'Louisiana',
                ME: 'Maine',
                MD: 'Maryland',
                MA: 'Massachusetts',
                MI: 'Michigan',
                MN: 'Minnesota',
                MS: 'Mississippi',
                MO: 'Missouri',
                MT: 'Montana',
                NE: 'Nebraska',
                NV: 'Nevada',
                NH: 'New Hampshire',
                NJ: 'New Jersey',
                NM: 'New Mexico',
                NY: 'New York',
                NC: 'North Carolina',
                ND: 'North Dakota',
                OH: 'Ohio',
                OK: 'Oklahoma',
                OR: 'Oregon',
                PA: 'Pennsylvania',
                RI: 'Rhode Island',
                SC: 'South Carolina',
                SD: 'South Dakota',
                TN: 'Tennessee',
                TX: 'Texas',
                UT: 'Utah',
                VT: 'Vermont',
                VA: 'Virginia',
                WA: 'Washington',
                WV: 'West Virginia',
                WI: 'Wisconsin',
                WY: 'Wyoming',
                DC: 'District of Columbia',
            });
            /** Canadian provinces and territories (no overlap with US state abbreviations except CA = country). */
            exports_1("CANADA_PROVINCE_NAMES", CANADA_PROVINCE_NAMES = {
                AB: 'Alberta',
                BC: 'British Columbia',
                MB: 'Manitoba',
                NB: 'New Brunswick',
                NL: 'Newfoundland and Labrador',
                NS: 'Nova Scotia',
                NT: 'Northwest Territories',
                NU: 'Nunavut',
                ON: 'Ontario',
                PE: 'Prince Edward Island',
                QC: 'Quebec',
                SK: 'Saskatchewan',
                YT: 'Yukon',
            });
            /** Canadian postal code pattern (A1A 1A1). */
            CAN_POSTAL = /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/i;
        }
    };
});
