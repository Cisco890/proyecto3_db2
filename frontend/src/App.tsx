import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { ImportPuzzlePage } from "./pages/ImportPuzzlePage";
import { PuzzleDetailPage } from "./pages/PuzzleDetailPage";
import { AssemblyPage } from "./pages/AssemblyPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/importar" element={<ImportPuzzlePage />} />
          <Route path="/puzzles/:puzzleId" element={<PuzzleDetailPage />} />
          <Route path="/puzzles/:puzzleId/armado" element={<AssemblyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
