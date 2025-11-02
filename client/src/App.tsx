import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { GameProvider } from './contexts/GameContext';
import { Home } from './pages/Home';
import { GameRoom } from './pages/GameRoom';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <GameProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/room/:roomId" element={<GameRoom />} />
              </Routes>
            </Router>
          </GameProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
