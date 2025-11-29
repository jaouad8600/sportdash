// Type definitions for parsed indication data
export interface ParsedIndicatie {
    naamJongere: string;
    leefgroep: string;
    indicatieActiviteit: string[]; // e.g., ["Sport", "Muziek"]
    adviesInhoudActiviteit: string;
    indicatieVanTot: string; // Original date range text (backwards compatibility)
    geldigVanaf?: string; // Parsed start date (ISO format)
    geldigTot?: string; // Parsed end date (ISO format) or null
    indicatieAfgegevenDoor: string;
    terugkoppelingAan: string;
    kanCombinerenMetGroepsgenoot: boolean | null;
    onderbouwingIndicering: string;
    bejegeningstips: string;
    leerdoelen: string;
    korteBeschrijving?: string; // Generated short description for table (max 150 chars)
}

// Response from the parse API
export interface ParsedIndicationResponse extends ParsedIndicatie {
    confidence?: number;
    warning?: string;
}
