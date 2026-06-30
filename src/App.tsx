import { useState } from 'react';
import './App.css';
import DisasterDashboard from './components/dashboard/DisasterDashboard';
import KerentananScreen from './components/kerentanan/KerentananScreen';
import GunungApiScreen from './components/gunungapi/GunungApiScreen';
import PotensiScreen from './components/potensi/PotensiScreen';

type AppScreen = 'dashboard' | 'kerentanan' | 'gunungapi' | 'potensi';

function App() {
  const [screen, setScreen] = useState<AppScreen>('dashboard');

  return (
    <div className="app-container">
      {screen === 'dashboard' && (
        <DisasterDashboard 
          onSwitchToKerentanan={() => setScreen('kerentanan')} 
          onSwitchToPotensi={() => setScreen('potensi')}
        />
      )}
      {screen === 'kerentanan' && (
        <KerentananScreen onBack={() => setScreen('dashboard')} />
      )}
      {screen === 'gunungapi' && (
        <GunungApiScreen onBack={() => setScreen('dashboard')} />
      )}
      {screen === 'potensi' && (
        <PotensiScreen onBack={() => setScreen('dashboard')} />
      )}
    </div>
  );
}

export default App;

