import WaterRipple from './WaterRipple';
import './App.css';

function App() {
  return (
    <div className="app-container">

        <WaterRipple 
          imageSrc="./background.png" 
          width={1000} 
          height={667} 
          rippleSize={5}
          strength={512}
          viscosity={0.05}        />
    </div>
  );
}

export default App;