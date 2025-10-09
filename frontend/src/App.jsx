import NavBar from "./components/NavBar";

import HomePage from "./pages/homepage";
import ProductPage from "./pages/productpage";

import {Routes, Route} from "react-router-dom"


function App() {
  
  return (
    <div className="min-h-screen bg-base-200 transition-colors duration-300" data-theme="luxury">
      <NavBar />

      <Routes>
        <Route path="/" element={<HomePage />}/>
        <Route path="/product/:id" element={<ProductPage />}/>
      </Routes>
    </div>
  )


}

export default App
