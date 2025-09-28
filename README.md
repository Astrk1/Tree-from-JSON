# Hierarchická Tabulka Dat

React aplikace pro zobrazování hierarchických JSON dat se stromovou strukturou, vlastním expand/collapse a bezpečným mazáním záznamů. Projekt řeší rekurzi, CORS, duplicitní ID v hierarchii a transformaci dat z JSON formátu na interaktivní tabulku.

---

## Obsah

1. [Rychlý přehled projektu](#1-rychlý-přehled-projektu)
2. [Instalace a spuštění](#2-instalace-a-spuštění)
3. [Architektura a struktura projektu](#3-architektura-a-struktura-projektu)
4. [Datový model a TypeScript typy](#4-datový-model-a-typescript-typy)
5. [Transformace dat - od JSON k hierarchické tabulce](#5-transformace-dat---od-json-k-hierarchické-tabulce)
6. [Frontend komponenty](#6-frontend-komponenty)
7. [Backend API](#7-backend-api)
8. [Řešené problémy a jejich opravy](#8-řešené-problémy-a-jejich-opravy)
9. [Testování](#9-testování)
10. [Troubleshooting](#10-troubleshooting)
11. [Možná vylepšení](#11-možná-vylepšení)

---

## 1. Rychlý přehled projektu

### Co projekt umí
- **Hierarchické zobrazování dat** - strom s expand/collapse funkcionalitou
- **Dynamické generování sloupců** - podle klíčů v JSON datech
- **Bezpečné mazání záznamů** - podle hierarchické cesty (path-based)
- **Práce s duplicitními ID** - rozlišuje záznamy podle pozice v hierarchii
- **TypeScript podpora** - plná typová bezpečnost
- **CORS middleware** - pro komunikaci mezi frontend a backend
- **Vlastní implementace** - bez závislosti na TanStack Table

### Klíčové vlastnosti
- Zachovává hierarchickou strukturu dat
- Jednoznačná identifikace záznamů pomocí `__path`
- Rekurzivní renderování tabulky
- Bezpečné mazání podle přesné pozice v stromu

---

## 2. Instalace a spuštění

### Instalace
```bash
git clone <repository-url>
cd my-app
npm install
```

### Spuštění
```bash
# 1. Server (Port 4000)
cd src
node server.js

# 2. React App (Port 3000) - v novém terminálu
npm start
```

## 3. Architektura a struktura projektu

### Architektura
```
React App (3000) ←→ Express Server (4000)
       ↓                    ↓
   Components            JSON File
   - Table               - example-data.json
   - TableStyles
   - Types
```

### Struktura souborů
```
my-app/
├── src/
│   ├── server.js                 # Express server s API endpointy
│   ├── App.tsx                   # Hlavní React komponenta
│   ├── example-data.json         # Zdrojová JSON data
│   └── Components/
│       ├── Table.tsx             # Hierarchická tabulka
│       ├── TableStyles.ts        # Styly pro tabulku
│       └── Types.tsx             # TypeScript definice
├── public/                       # Statické soubory
├── package.json                  # NPM dependencies
└── README.md                     # Tato dokumentace
```

---

## 4. Datový model a TypeScript typy

### Základní typ `Node`
```typescript
// src/Components/Types.tsx
export interface Node {
  data: Record<string, string>;
  children?: Record<string, { records: Node[] }>;
  __path?: string[];
}
```

### Vysvětlení polí
- **`data`**: Klíč-hodnota páry s daty záznamu (všechny hodnoty jako string)
- **`children`**: Hierarchické potomky seskupené podle typu relace
- **`__path`**: Interní identifikátor - cesta k záznamu v hierarchii (generuje server)

### Příklad JSON struktury
```json
[
  {
    "data": {
      "ID": "52",
      "Name": "Ford Prefect",
      "Gender": "M",
      "Ability": "has_towel"
    },
    "children": {
      "has_nemesis": {
        "records": [
          {
            "data": {
              "ID": "1684",
              "Character ID": "52",
              "Is alive?": "true",
              "Years": "28"
            },
            "children": {
              "has_secrete": {
                "records": [
                  {
                    "data": {
                      "ID": "1404",
                      "Nemesis ID": "1684",
                      "Secrete Code": "5464826016"
                    },
                    "children": {}
                  }
                ]
              }
            }
          }
        ]
      }
    }
  }
]
```

---

## 5. Transformace dat - od JSON k hierarchické tabulce

### Jak funguje transformace dat

Projekt transformuje surová JSON data na interaktivní hierarchickou tabulku ve třech hlavních krocích:

#### 1. Server načte surová JSON data
```javascript
// src/server.js - loadData()
const rawData = fs.readFileSync(DATA_FILE, "utf-8");
const parsedData = JSON.parse(rawData);
```

#### 2. Server přidá hierarchické cesty (`__path`)
```javascript
// src/server.js - addPathsToRecords()
function addPathsToRecords(records, basePath = []) {
  return records.map((record, index) => {
    const currentPath = [...basePath, index.toString()];
    const updatedRecord = {
      ...record,
      __path: currentPath  // Přidáme cestu k záznamu
    };

    if (record.children) {
      updatedRecord.children = Object.fromEntries(
        Object.entries(record.children).map(([key, value]) => [
          key,
          { 
            records: addPathsToRecords(
              value.records, 
              [...currentPath, key]  // Rozšíříme cestu o název sekce
            ) 
          }
        ])
      );
    }

    return updatedRecord;
  });
}
```

#### 3. Frontend vykreslí hierarchickou tabulku

**Krok 3a: Dynamické generování sloupců**
```typescript
// src/Components/Table.tsx
const columnKeys = React.useMemo(() => {
  return Array.from(new Set(rows.flatMap(row => Object.keys(row.data))));
}, [rows]);
```

**Krok 3b: Rekurzivní renderování**
```typescript
// Pro každý řádek s children:
{Object.entries(row.children!).map(([sectionName, sectionData]) => (
  <div key={sectionName}>
    <div style={tableStyles.sectionHeader}>
      {sectionName}  {/* např. "has_nemesis" */}
    </div>
    <TableBlock
      rows={sectionData.records}  // Rekurzivně renderuje potomky
      depth={depth + 1}
      onDelete={onDelete}
    />
  </div>
))}
```

### Příklad transformace

**Vstup (JSON):**
```json
{
  "data": { "ID": "52", "Name": "Ford Prefect" },
  "children": {
    "has_nemesis": {
      "records": [
        { "data": { "ID": "1684", "Years": "28" } }
      ]
    }
  }
}
```

**Po transformaci serveru:**
```json
{
  "data": { "ID": "52", "Name": "Ford Prefect" },
  "__path": ["0"],  // ← Přidáno serverem
  "children": {
    "has_nemesis": {
      "records": [
        { 
          "data": { "ID": "1684", "Years": "28" },
          "__path": ["0", "has_nemesis", "0"]  // ← Přidáno serverem
        }
      ]
    }
  }
}
```

**Výsledek v tabulce:**
```
┌─────┬──────────────┬────────┐
│ ID  │ Name         │ Akce   │
├─────┼──────────────┼────────┤
│ 52  │ Ford Prefect │ 🗑️     │
└─────┴──────────────┴────────┘
  ▼ has_nemesis
  ┌─────┬───────────┬──────┬────────┐
  │ ID  │ Character │ Years│ Akce   │
  │     │ ID        │      │        │
  ├─────┼───────────┼──────┼────────┤
  │1684 │ 52        │ 28   │ 🗑️     │
  └─────┴───────────┴──────┴────────┘
```

### Výhody této transformace
1. **Jednoznačná identifikace** - každý záznam má unikátní `__path`
2. **Zachování hierarchie** - struktura zůstává stromová
3. **Bezpečné mazání** - mazání podle cesty, ne podle ID
4. **Flexibilní sloupce** - automatické generování podle dat

---

## 6. Frontend komponenty

### `App.tsx` - Hlavní komponenta
- Načítá data z API (`GET /api/data`)
- Zobrazuje loading stavy a chyby
- Předává `onDelete(path)` funkci do tabulky
- Zpracovává odpovědi ze serveru

### `Table.tsx` - Hierarchická tabulka
- **`Table`** - wrapper komponenta
- **`TableBlock`** - rekurzivní komponenta pro vykreslování
- Vlastnosti:
  - Dynamické generování sloupců podle klíčů v `data`
  - Expand/collapse funkcionalita s `expandedRows` stavem
  - Rekurzivní renderování `children` sekcí
  - Mazání záznamů podle `__path`

### `TableStyles.ts` - Styly
- Exportuje `tableStyles` objekt
- Obsahuje styly pro tabulku, tlačítka, hlavičky
- Separace stylů od logiky

### `Types.tsx` - TypeScript definice
- Definuje `Node` interface
- Typová bezpečnost pro celý projekt

---

## 7. Backend API

### Endpointy

#### `GET /api/data`
Načte všechna data ze souboru a přidá `__path` k záznamům.

**Odpověď:**
```json
[
  {
    "data": { "ID": "52", "Name": "Ford Prefect" },
    "__path": ["0"],
    "children": { ... }
  }
]
```

#### `POST /api/delete`
Smaže záznam podle hierarchické cesty.

**Request:**
```json
{
  "path": ["0", "has_nemesis", "2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": [/* aktualizovaná data */]
}
```

### Klíčové funkce serveru

#### `addPathsToRecords()`
- Rekurzivně přidává `__path` ke všem záznamům
- Vytváří unikátní identifikátory pro bezpečné mazání

#### `removeRecordByPath()`
- Maže záznam podle přesné cesty v hierarchii
- Zabraňuje kolaterálnímu smazání duplicitních ID

#### CORS middleware
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
```

---

## 8. Řešené problémy a jejich opravy

### 1. Maximum Call Stack Size Exceeded (nekonečná rekurze)
**Problém:** Při použití TanStack Table vznikala nekonečná rekurze v `getSubRows`.

**Řešení:** 
- Odstranění TanStack Table
- Vlastní rekurzivní renderování v `TableBlock`
- Kontrolovaný stav `expandedRows`
- Explicitní předávání `parentPath`

### 2. Duplicitní ID - smazání jednoho smazalo všechny
**Problém:** Dva záznamy se stejným ID (např. "48") → smazání jednoho odstranilo oba.

**Řešení:**
- Mazání podle `__path` místo `ID`
- Server generuje unikátní cesty pro každý záznam
- `removeRecordByPath()` porovnává celou cestu

**Před opravou:**
```javascript
// Mazalo všechny záznamy se stejným ID
.filter(record => record.data.ID !== targetId)
```

**Po opravě:**
```javascript
// Maže pouze záznam s konkrétní cestou
.filter(record => {
  const recordPath = record.__path ? record.__path.join(".") : "";
  const targetPathStr = Array.isArray(targetPath) ? targetPath.join(".") : targetPath;
  return recordPath !== targetPathStr;
})
```

### 3. CORS chyby
**Problém:** Prohlížeč blokoval požadavky mezi `localhost:3000` a `localhost:4000`.

**Řešení:** Přidán CORS middleware na server s explicitním povolením origin a metod.

### 4. Failed to fetch při mazání
**Problém:** 
- Nesoulad payloadu (frontend `{ path }`, backend čekal `{ id }`)
- CORS blokace

**Řešení:**
- Sjednocení kontraktu - server očekává `{ path }`
- CORS middleware
- Validace vstupů

### 5. Zplošťování hierarchie (flatMap)
**Problém:** `flatMap` míchalo úrovně hierarchie dohromady.

**Řešení:** 
- Zachování hierarchie při renderování
- `Object.entries(row.children)` pro každou sekci zvlášť
- Rekurzivní `TableBlock` pro `sectionData.records`

---

## 9. Testování

### Manuální testování
1. **Načítání dat**: Ověřte `GET /api/data` vrací JSON s `__path`
2. **Zobrazení**: Zkontrolujte správné vykreslení root řádků
3. **Expand/collapse**: Rozbalte řádky, ověřte hierarchii
4. **Mazání**: Smažte konkrétní záznam, ověřte že se smazal pouze ten správný

---

## 10. Troubleshooting

### Aplikace zobrazí prázdnou stránku
- Otevřete DevTools → Console → hledejte runtime chyby
- Zkontrolujte Network → `/api/data` - vrací JSON (200) nebo HTML?
- Upravte `API_BASE_URL` v `App.tsx`

### `Unexpected token '<'`
- Dostáváte HTML místo JSON
- Frontend volá špatný endpoint
- Oprava: použijte správnou URL pro backend

### Mazání neprobíhá
- Zkontrolujte payload: `{"path": ["0","has_nemesis","2"]}`
- Ověřte backend logy a validaci
- Po mazání server vrací celý nový JSON

### TypeScript chyby o `__path`
- Ověřte `src/Components/Types.tsx` obsahuje `__path?: string[];`
- Restartujte dev server po změně typů

### Server se nespustí
- Zkontrolujte, že port 4000 není obsazen
- Windows: `netstat -ano | findstr :4000`
- Linux/Mac: `lsof -i :4000`

---

## 11. Možná vylepšení

### UI/UX vylepšení
- **Loading indikátory** pro jednotlivé operace
- **Potvrzovací dialogy** před smazáním
- **Tooltips** s informacemi o záznamech
- **Ikony** pro různé typy sekcí
- **Vyhledávání** v hierarchických datech

### Funkcionalita
- **Přidávání nových záznamů**
- **Editace existujících záznamů**
- **Export dat** (CSV, JSON)
- **Import dat** z různých formátů
- **Filtrování** podle sloupců

### Technické vylepšení
- **Virtualizace** pro velké datasety
- **Lazy loading** pro deep hierarchie
- **Caching** dat na frontendu
- **Optimistic updates** pro rychlejší UI
- **WebSocket** pro real-time aktualizace

### Bezpečnost
- **Autentizace** uživatelů
- **Autorizace** operací
- **Validace** vstupních dat
- **HTTPS** pro produkci

### Infrastruktura
- **Docker** kontejnery
- **Database** místo JSON souborů

---

## Licence

MIT License

---