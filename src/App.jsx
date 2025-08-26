import { Routes, Route } from "react-router-dom";
import { Prezentare } from "./prezentare/prezentare";
import { Artisti } from "./artisti/artisti";
import { Tabel } from "./tabel/tabel";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Prezentare />} />
      <Route path="/prezentare" element={<Prezentare />} />
      <Route path="/artisti" element={<Artisti />} />
      <Route path="/tabel" element={<Tabel />} />
    </Routes>
  );
}

export default App;
