/**
 * Parses natural language conference date strings (e.g., "January 11-17, 2026") 
 * into a valid mathematical Date object representing the start of the conference.
 * 
 * @param {string|Date} dateInput - The raw date string from conferences.yaml
 * @param {string|number} fallbackYear - The year of the conference to use if no year is explicitly in the string
 * @returns {Date|null} - A valid Date object or null if completely unparseable
 */
export function parseConferenceDate(dateInput, fallbackYear) {
    if (!dateInput) return null;
    
    // If it's already a native Date object (parsed by YAML)
    if (dateInput instanceof Date) return dateInput;

    const dateStr = String(dateInput).trim();
    
    // Try native parsing first (works for ISO dates like "2026-05-15" or standard strings like "June 15, 2026")
    const nativeDate = new Date(dateStr);
    if (!isNaN(nativeDate.getTime())) {
        // Native Date parser goes crazy with ranges like "January 10-16, 2027".
        // It ignores "2027" and assumes "16" is the year 2016!
        // We must ensure that the year the native parser chose actually matches the 4-digit year in the string (if one exists).
        const yearMatch = dateStr.match(/\b(20\d{2})\b/);
        const expectedYear = yearMatch ? parseInt(yearMatch[1], 10) : nativeDate.getFullYear();
        
        if (nativeDate.getFullYear() === expectedYear) {
            // Also protect against the default 2001 year fallback when no year is provided at all
            if (expectedYear !== 2001 || /\b2001\b/.test(dateStr)) {
                return nativeDate;
            }
        }
    }
    
    // Fallback: Smart Regex extraction for natural language ranges like "Sun 25 April - Sat 1 May 2027"
    const monthRegex = /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)/i;
    // Match the first valid day number (1-31)
    const dayRegex = /\b([1-9]|[12][0-9]|3[01])\b/;
    // Match a 4 digit year
    const yearRegex = /\b(20\d{2})\b/;
    
    const monthMatch = dateStr.match(monthRegex);
    if (!monthMatch) return null; // Cannot parse without at least a month
    
    const month = monthMatch[0];
    const dayMatch = dateStr.match(dayRegex);
    const day = dayMatch ? dayMatch[0] : 1; // Default to the 1st of the month if no day is found
    
    const yearMatch = dateStr.match(yearRegex);
    const year = yearMatch ? yearMatch[0] : fallbackYear;
    
    // Construct a standard string and parse it
    const parsedDate = new Date(`${month} ${day}, ${year}`);
    if (!isNaN(parsedDate.getTime())) return parsedDate;
    
    return null;
}
