import * as fs from 'fs';

function getCompData(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const result = { sprites: [], labels: [] };
    for (const item of data) {
        if (!item) continue;
        if (item.__type__ === 'cc.Sprite') {
            const comp = { ...item };
            delete comp._id;
            delete comp.node;
            result.sprites.push(comp);
        } else if (item.__type__ === 'cc.Label') {
            const comp = { ...item };
            delete comp._id;
            delete comp.node;
            result.labels.push(comp);
        }
    }
    return result;
}

const cli = getCompData('NewProject/assets/cli-test.fire');
const manual = getCompData('NewProject/assets/manual-test.fire');

console.log("=== SPRITE COMPARISON ===");
console.log("CLI   : ", JSON.stringify(cli.sprites[0], null, 2));
console.log("Manual: ", JSON.stringify(manual.sprites[0], null, 2));

console.log("\n=== LABEL COMPARISON ===");
console.log("CLI   : ", JSON.stringify(cli.labels[0], null, 2));
console.log("Manual: ", JSON.stringify(manual.labels[0], null, 2));
