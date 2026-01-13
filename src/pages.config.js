import Analysis from './pages/Analysis';
import AutoPlanning from './pages/AutoPlanning';
import BehaviorAnalysis from './pages/BehaviorAnalysis';
import DailyMode from './pages/DailyMode';
import Dashboard from './pages/Dashboard';
import EmergencyFund from './pages/EmergencyFund';
import Expenses from './pages/Expenses';
import FamilyMode from './pages/FamilyMode';
import Goals from './pages/Goals';
import Home from './pages/Home';
import Incomes from './pages/Incomes';
import Movements from './pages/Movements';
import Overview from './pages/Overview';
import Planning from './pages/Planning';
import Settings from './pages/Settings';
import Simulation from './pages/Simulation';
import TravelMode from './pages/TravelMode';
import Welcome from './pages/Welcome';
import TightMonth from './pages/TightMonth';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analysis": Analysis,
    "AutoPlanning": AutoPlanning,
    "BehaviorAnalysis": BehaviorAnalysis,
    "DailyMode": DailyMode,
    "Dashboard": Dashboard,
    "EmergencyFund": EmergencyFund,
    "Expenses": Expenses,
    "FamilyMode": FamilyMode,
    "Goals": Goals,
    "Home": Home,
    "Incomes": Incomes,
    "Movements": Movements,
    "Overview": Overview,
    "Planning": Planning,
    "Settings": Settings,
    "Simulation": Simulation,
    "TravelMode": TravelMode,
    "Welcome": Welcome,
    "TightMonth": TightMonth,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};