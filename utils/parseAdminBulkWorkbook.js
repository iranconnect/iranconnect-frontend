const DEFAULT_MAX_ROWS = 500;
const DEFAULT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_COLUMNS = 20;

function normalizeHeader(value) {
  return String(value ?? "").trim();
}

function normalizeCellValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value).trim();
}

function assertXlsxExtension(file) {
  const filename = String(file?.name || "")
    .trim()
    .toLowerCase();

  if (!filename.endsWith(".xlsx")) {
    throw new Error("Only .xlsx Excel files are supported.");
  }
}

function assertFileSize(file, maxFileSizeBytes) {
  if (!Number.isFinite(file?.size) || file.size <= 0) {
    throw new Error("The selected Excel file is empty or invalid.");
  }

  if (file.size > maxFileSizeBytes) {
    const maxSizeMb = Math.floor(
      maxFileSizeBytes / (1024 * 1024)
    );

    throw new Error(
      `Excel file is too large. Maximum allowed size is ${maxSizeMb} MB.`
    );
  }
}

function assertZipSignature(arrayBuffer) {
  const bytes = new Uint8Array(
    arrayBuffer,
    0,
    Math.min(arrayBuffer.byteLength, 4)
  );

  if (
    bytes.length < 2 ||
    bytes[0] !== 0x50 ||
    bytes[1] !== 0x4b
  ) {
    throw new Error(
      "The selected file is not a valid .xlsx workbook."
    );
  }
}

function assertHeaders({
  headerRow,
  expectedHeaders,
  maxColumns,
}) {
  if (headerRow.length > maxColumns) {
    throw new Error(
      `Excel sheet contains too many columns. Maximum allowed is ${maxColumns}.`
    );
  }

  const actualHeaders = headerRow.map(normalizeHeader);

  while (
    actualHeaders.length &&
    actualHeaders[actualHeaders.length - 1] === ""
  ) {
    actualHeaders.pop();
  }

  const expected = expectedHeaders.map(normalizeHeader);

  const headersMatch =
    actualHeaders.length === expected.length &&
    expected.every(
      (header, index) => actualHeaders[index] === header
    );

  if (!headersMatch) {
    throw new Error(
      `Invalid Excel columns. Expected: ${expected.join(", ")}.`
    );
  }
}

export async function parseAdminBulkWorkbook(
  file,
  {
    sheetName,
    expectedHeaders,
    maxRows = DEFAULT_MAX_ROWS,
    maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES,
    maxColumns = DEFAULT_MAX_COLUMNS,
  }
) {
  if (!file) {
    throw new Error("Please select an Excel file.");
  }

  if (
    !sheetName ||
    !Array.isArray(expectedHeaders) ||
    !expectedHeaders.length
  ) {
    throw new Error("Excel parser configuration is invalid.");
  }

  assertXlsxExtension(file);
  assertFileSize(file, maxFileSizeBytes);

  const arrayBuffer = await file.arrayBuffer();

  assertZipSignature(arrayBuffer);

  const { readSheet } = await import(
    "read-excel-file/browser"
  );

  let worksheetRows;

  try {
    worksheetRows = await readSheet(
      file,
      sheetName
    );
  } catch {
    throw new Error("Failed to read the Excel workbook.");
  }

  if (
    !Array.isArray(worksheetRows) ||
    worksheetRows.length < 2
  ) {
    throw new Error("Excel file has no data rows.");
  }

  const [headerRow, ...dataRows] = worksheetRows;

  assertHeaders({
    headerRow,
    expectedHeaders,
    maxColumns,
  });

  const rows = [];

  for (let index = 0; index < dataRows.length; index += 1) {
    const worksheetRow = dataRows[index];

    if (worksheetRow.length > maxColumns) {
      throw new Error(
        `Excel row ${index + 2} contains too many columns.`
      );
    }

    const values = expectedHeaders.map(
      (header, columnIndex) => [
        header,
        normalizeCellValue(
          worksheetRow[columnIndex]
        ),
      ]
    );

    const hasData = values.some(
      ([, value]) => value !== ""
    );

    if (!hasData) {
      continue;
    }

    rows.push(Object.fromEntries(values));

    if (rows.length > maxRows) {
      throw new Error(
        `Maximum ${maxRows} rows allowed per upload.`
      );
    }
  }

  if (!rows.length) {
    throw new Error("Excel file has no data rows.");
  }

  return rows;
}
