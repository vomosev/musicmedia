function normalizeColumn(column, index) {
  if (typeof column === 'string') {
    return {
      key: column,
      label: column,
      columnId: column,
      index,
    };
  }

  const key = column?.key ?? column?.accessorKey ?? `column-${index}`;

  return {
    ...column,
    key,
    label: column?.label ?? column?.header ?? key,
    columnId: String(column?.id ?? key),
    index,
  };
}

function getCellValue(row, column) {
  if (typeof column.accessor === 'function') {
    return column.accessor(row);
  }

  if (row == null || typeof row !== 'object') {
    return undefined;
  }

  return row[column.key];
}

function getRowKey(row, index, rowKey) {
  let value;

  if (typeof rowKey === 'function') {
    value = rowKey(row, index);
  } else if (row != null && typeof row === 'object') {
    value = row[rowKey];
  }

  if (value === undefined || value === null || value === '') {
    return `table-row-${index}`;
  }

  return String(value);
}

function getDataLabel(label) {
  if (typeof label === 'string' || typeof label === 'number') {
    return String(label);
  }

  return undefined;
}

export function Table({
  caption,
  columns = [],
  rows = [],
  rowKey = 'id',
  cellRenderers = {},
  renderCell,
  truncate = false,
}) {
  const normalizedColumns = Array.isArray(columns)
    ? columns.map(normalizeColumn)
    : [];
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <div className="table-wrapper">
      <table className="data-table">
        {caption ? <caption className="table-caption">{caption}</caption> : null}

        <thead className="table-head">
          <tr className="table-row">
            {normalizedColumns.map((column) => (
              <th
                className="table-header-cell"
                key={column.columnId}
                scope="col"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="table-body">
          {safeRows.map((row, rowIndex) => {
            const resolvedRowKey = getRowKey(row, rowIndex, rowKey);

            return (
              <tr className="table-row" key={resolvedRowKey}>
                {normalizedColumns.map((column) => {
                  const value = getCellValue(row, column);
                  const columnRenderer =
                    column.render ??
                    column.renderCell ??
                    cellRenderers[column.key];
                  const content =
                    typeof columnRenderer === 'function'
                      ? columnRenderer(value, row, rowIndex, column)
                      : typeof renderCell === 'function'
                        ? renderCell(value, row, column, rowIndex)
                        : value;
                  const shouldTruncate =
                    column.truncate === true ||
                    (truncate === true && column.truncate !== false);
                  const mobileLabel =
                    column.mobileLabel ?? column.label;

                  return (
                    <td
                      className={
                        shouldTruncate
                          ? 'table-cell table-cell-truncate'
                          : 'table-cell'
                      }
                      data-label={getDataLabel(mobileLabel)}
                      key={column.columnId}
                    >
                      <span
                        aria-hidden="true"
                        className="table-cell-label"
                      >
                        {mobileLabel}
                      </span>
                      <span
                        className={
                          shouldTruncate
                            ? 'table-cell-content table-cell-content-truncate'
                            : 'table-cell-content'
                        }
                      >
                        {content === undefined || content === null || content === ''
                          ? '—'
                          : content}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Table;