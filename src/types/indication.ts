// Type definitions for parsed indication data
export interface ParsedIndicatie {
    naamJongere: string;
    leefgroep: string;
    indicatieActiviteit: string[]; // e.g., ["Sport", "Muziek"]
    adviesInhoudActiviteit: string;
    indicatieVanTot: string;
    indicatieAfgegevenDoor: string;
    terugkoppelingAan: string;
    kanCombinerenMetGroepsgenoot: boolean | null;
    onderbouwingIndicering: string;
    bejegeningstips: string;
    leerdoelen: string;
}

// Response from the parse API
export interface ParsedIndicationResponse extends ParsedIndicatie {
    confidence?: number;
    warning?: string;
}
