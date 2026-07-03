import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { PROVINCES } from './src/constants/provinces.ts';
import { KPWBI_OFFICES } from './src/constants/kpwbiOffices.ts';
import { MOCK_ALERTS } from './src/constants/alerts.ts';
import { MEGATHRUST_ZONES } from './src/constants/megathrustZones.ts';
import { ENSO_HISTORY } from './src/constants/ensoData.ts';
import { CHECKLIST_ITEMS } from './src/constants/preparednessChecklist.ts';
import { RING_OF_FIRE_ARCS, VOLCANO_POINTS } from './src/constants/ringOfFire.ts';

function toCsv(dataArray: any[]): string {
    if (!dataArray || dataArray.length === 0) return '';
    const headers = Object.keys(dataArray[0]);
    const rows = dataArray.map(obj => 
        headers.map(header => {
            const val = obj[header];
            if (val === null || val === undefined) return '';
            // If it's an array or object, stringify it
            const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
            if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
                return `"${strVal.replace(/"/g, '""')}"`;
            }
            return strVal;
        }).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
}

function writeCsv(filename: string, dataArray: any[]) {
    if (!dataArray || dataArray.length === 0) return;
    const csvContent = toCsv(dataArray);
    const outputPath = path.join(__dirname, filename);
    fs.writeFileSync(outputPath, csvContent);
    console.log(`Created ${filename} (${dataArray.length} records)`);
}

writeCsv('Provinces.csv', PROVINCES);
writeCsv('KpwbiOffices.csv', KPWBI_OFFICES);
writeCsv('DisasterAlerts.csv', MOCK_ALERTS);
writeCsv('MegathrustZones.csv', MEGATHRUST_ZONES);
writeCsv('EnsoHistory.csv', ENSO_HISTORY);
writeCsv('PreparednessChecklist.csv', CHECKLIST_ITEMS);
writeCsv('RingOfFireArcs.csv', RING_OF_FIRE_ARCS);
writeCsv('VolcanoPoints.csv', VOLCANO_POINTS);

console.log('All CSV files generated successfully.');
