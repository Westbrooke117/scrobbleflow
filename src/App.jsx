import {Route, Routes} from "react-router-dom";
import {UserInputPage} from "./pages/UserInputPage.jsx";
import {ChartPage} from "./pages/ChartPage.jsx";

const App = () => {
  return <Routes>
    <Route path="/" element={<UserInputPage/>} />
    <Route path="/chart/:user/:urlDataSource" element={<ChartPage/>} />
  </Routes>
}

export default App
