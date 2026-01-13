import Analysis from './pages/Analysis';
import AutoPlanning from './pages/AutoPlanning';
import BehaviorAnalysis from './pages/BehaviorAnalysis';
import DailyMode from './pages/DailyMode';
import Dashboard from './pages/Dashboard';
import EmergencyFund from './pages/EmergencyFund';
import Expenses from './pages/Expenses';
import FamilyMode from './pages/FamilyMode';
import Home from './pages/Home';
import Incomes from './pages/Incomes';
import Movements from './pages/Movements';
import Settings from './pages/Settings';
import TightMonth from './pages/TightMonth';
import Welcome from './pages/Welcome';
import DailyCheckIn from './pages/DailyCheckIn';
import Goals from './pages/Goals';
import Overview from './pages/Overview';
import Planning from './pages/Planning';
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
    "Home": Home,
    "Incomes": Incomes,
    "Movements": Movements,
    "Settings": Settings,
    "TightMonth": TightMonth,
    "Welcome": Welcome,
    "DailyCheckIn": DailyCheckIn,
    "Goals": Goals,
    "Overview": Overview,
    "Planning": Planning,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};