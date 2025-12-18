import Dashboard from './pages/Dashboard';
import Incomes from './pages/Incomes';
import Expenses from './pages/Expenses';
import Goals from './pages/Goals';
import Settings from './pages/Settings';
import Simulation from './pages/Simulation';
import Welcome from './pages/Welcome';
import DailyMode from './pages/DailyMode';
import AutoPlanning from './pages/AutoPlanning';
import EmergencyFund from './pages/EmergencyFund';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Incomes": Incomes,
    "Expenses": Expenses,
    "Goals": Goals,
    "Settings": Settings,
    "Simulation": Simulation,
    "Welcome": Welcome,
    "DailyMode": DailyMode,
    "AutoPlanning": AutoPlanning,
    "EmergencyFund": EmergencyFund,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};