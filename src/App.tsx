import React, { useEffect, useState } from "react";
import { Table } from "./Components/Table";
import { Node } from "./Components/Types";

const API_BASE_URL = "http://localhost:4000/api";

function App() {
  const [data, setData] = useState<Node[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/data`);
      if (!response.ok) {
        throw new Error(`Server chyba: ${response.status}`);
      }
      
      const jsonData = await response.json();
      setData(jsonData);
    } catch (err: any) {
      console.error("Chyba při načítání dat:", err);
      setError(err.message || "Neznámá chyba");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (recordPath: string[]) => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: recordPath }),
      });
      
      if (!response.ok) {
        throw new Error(`Mazání selhalo: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Neznámá chyba při mazání");
      }
    } catch (err: any) {
      console.error("Chyba při mazání:", err);
      setError(err.message || "Neznámá chyba");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Hierarchická tabulka dat</h1>
      
      {loading && (
        <div style={{ padding: "20px", textAlign: "center" }}>
          Načítám data...
        </div>
      )}
      
      {error && (
        <div style={{ 
          color: "red", 
          padding: "10px", 
          backgroundColor: "#ffe6e6",
          border: "1px solid #ffcccc",
          borderRadius: "4px",
          marginBottom: "20px"
        }}>
          Chyba: {error}
        </div>
      )}
      
      {!loading && !error && (
        <Table 
          data={data} 
          onDelete={handleDeleteRecord} 
        />
      )}
    </div>
  );
}

export default App;
