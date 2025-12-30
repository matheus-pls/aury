import AutoPlanning from './pages/AutoPlanning';
import BehaviorAnalysis from './pages/BehaviorAnalysis';
import DailyMode from './pages/DailyMode';
import Dashboard from './pages/Dashboard';
import EmergencyFund from './pages/EmergencyFund';
import Expenses from './pages/Expenses';
import Home from './pages/Home';
import Incomes from './pages/Incomes';
import Settings from './pages/Settings';
import Simulation from './pages/Simulation';
import TravelMode from './pages/TravelMode';
import Welcome from './pages/Welcome';
import Goals from './pages/Goals';
import Overview from './pages/Overview';
import Planning from './pages/Planning';
import Movements from './pages/Movements';
import GoalsHub from './pages/GoalsHub';
import Analysis from './pages/Analysis';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AutoPlanning": AutoPlanning,
    "BehaviorAnalysis": BehaviorAnalysis,
    "DailyMode": DailyMode,
    "Dashboard": Dashboard,
    "EmergencyFund": EmergencyFund,
    "Expenses": Expenses,
    "Home": Home,
    "Incomes": Incomes,
    "Settings": Settings,
    "Simulation": Simulation,
    "TravelMode": TravelMode,
    "Welcome": Welcome,
    "Goals": Goals,
    "Overview": Overview,
    "Planning": Planning,
    "Movements": Movements,
    "GoalsHub": GoalsHub,
    "Analysis": Analysis,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};