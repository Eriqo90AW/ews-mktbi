import fs from 'fs';

async function testFetchEarlyWarning() {
  try {
    const response = await fetch('https://www.bmkg.go.id/cuaca/peringatan-dini-cuaca');
    const html = await response.text();

    const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) {
      console.log('No tbody found');
      return;
    }

    const tbody = tbodyMatch[1];
    const alerts = [];
    const rxTr = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let mTr;

    while ((mTr = rxTr.exec(tbody)) !== null) {
      const trContent = mTr[1];
      const rxTd = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let mTd;
      const cells = [];
      while ((mTd = rxTd.exec(trContent)) !== null) {
        cells.push(mTd[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      }

      if (cells.length >= 5) {
        const provinceName = cells[1];
        const waktuMulai = cells[2];
        const waktuBerakhir = cells[3];
        const detail = cells[4];

        alerts.push({
          provinceName,
          waktuMulai,
          waktuBerakhir,
          detail
        });
      }
    }

    fs.writeFileSync('test_output.json', JSON.stringify(alerts, null, 2));
    console.log('Wrote', alerts.length, 'alerts to test_output.json');
  } catch (error) {
    console.error('Failed:', error);
  }
}

testFetchEarlyWarning();
