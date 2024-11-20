import React from "react";
import "./App.css"; // Import global styles
import EyeballUI from "./components/EyeballUI/EyeballUI"; // Adjust the import path for the EyeballUI component

const App: React.FC = () => {
  return (
    <div className="App">
      
        <EyeballUI /> {/* Render the EyeballUI component */}
      
    </div>
  );
};

export default App;
