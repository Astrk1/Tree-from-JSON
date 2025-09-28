import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 4000;
const DATA_FILE = path.join(process.cwd(), "example-data.json");

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

function addPathsToRecords(records, basePath = []) {
  return records.map((record, index) => {
    const currentPath = [...basePath, index.toString()];
    const updatedRecord = {
      ...record,
      __path: currentPath
    };

    if (record.children) {
      updatedRecord.children = Object.fromEntries(
        Object.entries(record.children).map(([key, value]) => [
          key,
          { 
            records: addPathsToRecords(
              value.records, 
              [...currentPath, key]
            ) 
          }
        ])
      );
    }

    return updatedRecord;
  });
}

function loadData() {
  try {
    const rawData = fs.readFileSync(DATA_FILE, "utf-8");
    const parsedData = JSON.parse(rawData);
    return addPathsToRecords(parsedData);
  } catch (error) {
    console.error("Chyba při načítání dat:", error);
    return [];
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Chyba při ukládání dat:", error);
    return false;
  }
}

function removeRecordByPath(records, targetPath) {
  return records
    .filter(record => {
      // Porovnáme celou cestu, ne jen ID
      const recordPath = record.__path ? record.__path.join(".") : "";
      const targetPathStr = Array.isArray(targetPath) ? targetPath.join(".") : targetPath;
      return recordPath !== targetPathStr;
    })
    .map(record => ({
      ...record,
      children: record.children 
        ? Object.fromEntries(
            Object.entries(record.children).map(([key, value]) => [
              key,
              { records: removeRecordByPath(value.records, targetPath) }
            ])
          )
        : undefined
    }));
}

app.get("/api/data", (req, res) => {
  const data = loadData();
  res.json(data);
});

app.post("/api/delete", (req, res) => {
  const { path } = req.body;
  
  if (!path) {
    return res.status(400).json({ 
      success: false, 
      error: "Path záznamu je povinný" 
    });
  }

  const currentData = loadData();
  const updatedData = removeRecordByPath(currentData, path);
  
  const dataToSave = JSON.parse(JSON.stringify(updatedData, (key, value) => {
    if (key === '__path') return undefined;
    return value;
  }));
  
  if (saveData(dataToSave)) {
    res.json({ success: true, data: addPathsToRecords(dataToSave) });
  } else {
    res.status(500).json({ 
      success: false, 
      error: "Chyba při ukládání dat" 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server běží na http://localhost:${PORT}`);
});
