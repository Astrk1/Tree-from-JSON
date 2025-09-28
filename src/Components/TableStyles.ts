export const tableStyles = {
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  header: {
    borderBottom: "1px solid #ddd",
    textAlign: "left" as const,
    padding: "6px 8px",
    backgroundColor: "#f5f5f5",
  },
  cell: {
    padding: "6px 8px",
    borderBottom: "1px solid #f3f3f3",
  },
  expandButton: {
    marginRight: 8,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
  },
  deleteButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
  },
  sectionHeader: {
    background: "#f9f9f9",
    fontWeight: "bold" as const,
    padding: "4px 8px",
    borderBottom: "1px solid #ddd",
    marginTop: 10,
  },
} as const;
