'use client';

import IndicationTextParser from '@/components/IndicationTextParser';

export default function TestParserPage() {
    const handleParsed = (data: any) => {
        console.log('Geparseerde data:', data);
        // Hier kun je de data verwerken, bijvoorbeeld:
        // - Opslaan in state
        // - Versturen naar een API
        // - Invullen in een formulier
    };

    return (
        <div className="max-w-5xl mx-auto p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Indicatie Tekst Parser - Demo
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Test de nieuwe parser voor "Aanmelding geïndiceerde activiteiten"
                </p>
            </div>

            <IndicationTextParser onParsed={handleParsed} />

            {/* Voorbeeld tekst voor testen */}
            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    💡 Tip: Test met deze voorbeeldtekst
                </h3>
                <details className="text-sm">
                    <summary className="cursor-pointer text-blue-700 dark:text-blue-300 font-medium">
                        Klik hier voor voorbeeldtekst
                    </summary>
                    <pre className="mt-3 p-4 bg-white dark:bg-gray-900 rounded border border-blue-200 dark:border-blue-700 text-xs overflow-x-auto whitespace-pre-wrap">
                        {`Aanmelding geïndiceerde activiteiten
Naam jongere: Pablo de Jeger
Leefgroep: Nes
Indicatie voor*
* zet een X achter welke activiteit van toepassing is
Sport (Orlando, Sebastiaan, Tim)  X
Muziek (Ben)
Creatief aanbod (Laura)

Advies/suggestie betreft inhoud activiteit: -
Indicatie afgegeven van – tot: 14-11-2025
Indicatie afgegeven door: 16-12-2025
Terugkoppelen voortgang aan: GW
Kan gecombineerd worden met groepsgenoot met indicatie? Ja
Onderbouwing indicering: Op de leefgroep wordt Pablo gezien als een impulsieve jongen, die sterk gebaat is bij duidelijkheid en structuur. Hij is snel afgeleid door externe prikkels en kan zich daardoor moeilijk concentreren op een taak. Pablo is gebaat bij een positieve bejegening, alleen staat zijn impulsiviteit hem vaak in de weg.
Bejegeningstips in het licht van de diagnostiek:
- Sluit aan bij Pablo en luister naar hem. Als hij goed en vertrouwd contact ervaart, is er meer ruimte om hem positief te beïnvloeden.
- Als er regels worden uitgelegd, probeer dan ook het waarom uit te leggen.
- Werk met korte time-outs: minimaal 15 minuten en maximaal 30 minuten.
Leerdoelen: ( indien van toepassing) N.v.t.`}
                    </pre>
                </details>
            </div>
        </div>
    );
}
