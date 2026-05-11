// Pure-JS Excel exporter: builds a SpreadsheetML 2003 XML workbook (.xls)
// that opens natively in Microsoft Excel, WPS Office, Numbers, and most
// mobile spreadsheet apps. Avoids any extra npm dependency.

const xmlEscape = (val) => {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const cellNumber = (n) => `<Cell><Data ss:Type="Number">${n}</Data></Cell>`;
const cellString = (s) => `<Cell><Data ss:Type="String">${xmlEscape(s)}</Data></Cell>`;

const buildRow = (cells) => `<Row>${cells.join('')}</Row>`;

const fullTimeStr = (ts) => {
  const d = new Date(ts);
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} `
    + `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const parseDuration = (s) => {
  const n = parseFloat(String(s || '').replace(/s$/i, ''));
  return Number.isFinite(n) ? n : 0;
};

const dateBoundary = (dateStr, endOfDay) => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map((x) => parseInt(x, 10));
  if (!y || !m || !d) return null;
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
    : new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
};

export const filterByDateRange = (records, startDate, endDate) => {
  const startTs = dateBoundary(startDate, false);
  const endTs = dateBoundary(endDate, true);
  return records.filter((r) => {
    if (typeof r.ts !== 'number') return false;
    if (startTs !== null && r.ts < startTs) return false;
    if (endTs !== null && r.ts > endTs) return false;
    return true;
  });
};

const buildSummarySheet = (records) => {
  const header = buildRow([
    cellString('时间'),
    cellString('模式'),
    cellString('成绩'),
    cellString('用时(秒)'),
    cellString('题目数'),
  ]);
  const rows = records.map((r) => {
    const detailLen = Array.isArray(r.detail) ? r.detail.length : 0;
    return buildRow([
      cellString(fullTimeStr(r.ts)),
      cellString(r.modeName || r.mode || ''),
      cellString(r.summary || ''),
      cellNumber(parseDuration(r.duration).toFixed(1)),
      cellNumber(detailLen),
    ]);
  });
  return `<Worksheet ss:Name="训练汇总"><Table>${header}${rows.join('')}</Table></Worksheet>`;
};

const buildDetailSheet = (records) => {
  const header = buildRow([
    cellString('时间'),
    cellString('模式'),
    cellString('题号'),
    cellString('题目'),
    cellString('你的答案'),
    cellString('是否正确'),
    cellString('正确答案'),
    cellString('单题用时'),
    cellString('错误次数'),
    cellString('是否跳过'),
    cellString('分步用时'),
  ]);

  const rows = [];
  records.forEach((r) => {
    const details = Array.isArray(r.detail) ? r.detail : [];
    if (details.length === 0) {
      rows.push(buildRow([
        cellString(fullTimeStr(r.ts)),
        cellString(r.modeName || r.mode || ''),
        cellString(''),
        cellString('(无明细)'),
        cellString(''), cellString(''), cellString(''),
        cellString(''), cellString(''), cellString(''), cellString(''),
      ]));
      return;
    }
    details.forEach((d, i) => {
      const okStr = d.ok === undefined ? '' : (d.ok ? '✓' : '✗');
      rows.push(buildRow([
        cellString(fullTimeStr(r.ts)),
        cellString(r.modeName || r.mode || ''),
        cellNumber(i + 1),
        cellString(d.q || ''),
        cellString(d.yourAns !== undefined ? d.yourAns : ''),
        cellString(okStr),
        cellString(d.realAns !== undefined ? d.realAns : ''),
        cellString(d.usedStr || ''),
        cellString(d.wrong !== undefined ? d.wrong : ''),
        cellString(d.skipped ? '是' : ''),
        cellString(d.detailTimes || ''),
      ]));
    });
  });

  return `<Worksheet ss:Name="题目详情"><Table>${header}${rows.join('')}</Table></Worksheet>`;
};

export const buildWorkbookXml = (records) => {
  const head = '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<?mso-application progid="Excel.Sheet"?>\n'
    + '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n'
    + ' xmlns:o="urn:schemas-microsoft-com:office:office"\n'
    + ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n'
    + ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n'
    + ' xmlns:html="http://www.w3.org/TR/REC-html40">';
  const tail = '</Workbook>';
  return head + buildSummarySheet(records) + buildDetailSheet(records) + tail;
};

export const downloadExcelFile = (filename, xmlContent) => {
  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
};

export const buildExportFilename = (startDate, endDate) => {
  const fmt = (s) => (s ? s.replace(/-/g, '') : 'all');
  return `历史记录_${fmt(startDate)}_${fmt(endDate)}.xls`;
};
