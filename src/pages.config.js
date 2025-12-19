import AutoPlanning from './pages/AutoPlanning';
import BehaviorAnalysis from './pages/BehaviorAnalysis';
import DailyMode from './pages/DailyMode';
import Dashboard from './pages/Dashboard';
import EmergencyFund from './pages/EmergencyFund';
import Expenses from './pages/Expenses';
import Goals from './pages/Goals';
import Home from './pages/Home';
import Incomes from './pages/Incomes';
import Settings from './pages/Settings';
import Simulation from './pages/Simulation';
import Welcome from './pages/Welcome';
import TravelMode from './pages/TravelMode';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AutoPlanning": AutoPlanning,
    "BehaviorAnalysis": BehaviorAnalysis,
    "DailyMode": DailyMode,
    "Dashboard": Dashboard,
    "EmergencyFund": EmergencyFund,
    "Expenses": Expenses,
    "Goals": Goals,
    "Home": Home,
    "Incomes": Incomes,
    "Settings": Settings,
    "Simulation": Simulation,
    "Welcome": Welcome,
    "TravelMode": TravelMode,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};