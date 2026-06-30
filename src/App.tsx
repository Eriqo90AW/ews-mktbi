import { useState } from 'react';
import './App.css';
import DisasterDashboard from './components/dashboard/DisasterDashboard';
import KerentananScreen from './components/kerentanan/KerentananScreen';
import GunungApiScreen from './components/gunungapi/GunungApiScreen';
import PerkiraanScreen from './components/perkiraan/PerkiraanScreen';

type AppScreen = 'dashboard' | 'kerentanan' | 'gunungapi' | 'perkiraan';

function App() {
  const [screen, setScreen] = useState<AppScreen>('dashboard');

  return (
    <div className="app-container">
      {screen === 'dashboard' && (
        <DisasterDashboard
          onSwitchToKerentanan={() => setScreen('kerentanan')}
          onSwitchToPerkiraan={() => setScreen('perkiraan')}
        />
      )}
      {screen === 'kerentanan' && (
        <KerentananScreen onBack={() => setScreen('dashboard')} />
      )}
      {screen === 'gunungapi' && (
        <GunungApiScreen onBack={() => setScreen('dashboard')} />
      )}
      {screen === 'perkiraan' && (
        <PerkiraanScreen onBack={() => setScreen('dashboard')} />
      )}
    </div>
  );
}

export default App;

