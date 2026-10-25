import { Routes, Route, Navigate } from "react-router-dom";
import Creator from "./pages/Creator";
import Anniversary from "./pages/Anniversary";
import { IS_DEV } from "./lib/env";

export default function App() {
  return (
    <div className="min-h-screen bg-aurora-soft text-slate-900">
      <Routes>
        {IS_DEV && <Route path="/creator" element={<Creator />} />}
        {IS_DEV ? (
          <Route path="/" element={<Creator />} />
        ) : (
          <Route path="/" element={<Anniversary />} />
        )}
        <Route path="/anniversary" element={<Anniversary />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
