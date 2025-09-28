import React from "react";
import { Node } from "./Types";
import { tableStyles } from "./TableStyles";

interface TableBlockProps {
  rows: Node[];
  depth?: number;
  onDelete: (recordPath: string[]) => void;
}

interface TableProps {
  data: Node[];
  onDelete: (recordPath: string[]) => void;
}


const TableBlock: React.FC<TableBlockProps> = ({ rows, depth = 0, onDelete }) => {
  const [expandedRows, setExpandedRows] = React.useState<Record<string, boolean>>({});

  // Získání všech unikátních klíčů z dat
  const columnKeys = React.useMemo(() => {
    return Array.from(new Set(rows.flatMap(row => Object.keys(row.data))));
  }, [rows]);

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const hasChildren = (row: Node): boolean => {
    return !!(row.children && Object.keys(row.children).length > 0);
  };

  // Generování unikátního ID pro řádek
  const getRowId = (row: Node, index: number): string => {
    return row.__path ? row.__path.join(".") : `row-${index}`;
  };

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <table style={tableStyles.table}>
        <thead>
          <tr>
            {columnKeys.map(key => (
              <th key={key} style={tableStyles.header}>
                {key}
              </th>
            ))}
            <th style={tableStyles.header}>Akce</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const rowId = getRowId(row, rowIndex);
            const isExpanded = expandedRows[rowId];
            const rowHasChildren = hasChildren(row);

            return (
              <React.Fragment key={rowId}>
                {/* Hlavní řádek s daty */}
                <tr>
                  {columnKeys.map((key, cellIndex) => (
                    <td key={key} style={tableStyles.cell}>
                      {cellIndex === 0 && rowHasChildren && (
                        <button
                          onClick={() => toggleRowExpansion(rowId)}
                          style={tableStyles.expandButton}
                          aria-label={isExpanded ? "Sbalit" : "Rozbalit"}
                        >
                          {isExpanded ? "▼" : "▶"}
                        </button>
                      )}
                      {row.data[key] ?? ""}
                    </td>
                  ))}
                  <td style={tableStyles.cell}>
                    {!row.data.ID.startsWith("__section__") && row.__path && (
                      <button
                        onClick={() => onDelete(row.__path!)}
                        style={tableStyles.deleteButton}
                        title="Smazat záznam"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>

                {/* Rozbalené potomky */}
                {isExpanded && rowHasChildren && (
                  <tr>
                    <td colSpan={columnKeys.length + 1} style={{ padding: 0 }}>
                      {Object.entries(row.children!).map(([sectionName, sectionData]) => (
                        <div key={sectionName} style={{ marginLeft: 20 }}>
                          <div style={tableStyles.sectionHeader}>
                            {sectionName}
                          </div>
                          <TableBlock
                            rows={sectionData.records}
                            depth={depth + 1}
                            onDelete={onDelete}
                          />
                        </div>
                      ))}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const Table: React.FC<TableProps> = ({ data, onDelete }) => {
  return <TableBlock rows={data} onDelete={onDelete} />;
};
