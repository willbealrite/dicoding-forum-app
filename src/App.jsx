import { Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function HomePage() {
  const { user, token } = useSelector((state) => state.auth);

  return (
    <main className="home-placeholder">
      <p className="eyebrow">DICODING COMMUNITY</p>
      <h1>Forum Diskusi</h1>
      <p>
        {token
          ? `Selamat datang, ${user?.name || "pengguna"}!`
          : "Fondasi forum kita siap. Selanjutnya, kita bangun daftar thread."}
      </p>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
