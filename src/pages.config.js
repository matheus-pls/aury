/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Analysis from './pages/Analysis';
import AutoPlanning from './pages/AutoPlanning';
import BehaviorAnalysis from './pages/BehaviorAnalysis';
import CategoryDistribution from './pages/CategoryDistribution';
import ConsumptionPatterns from './pages/ConsumptionPatterns';
import DailyCheckIn from './pages/DailyCheckIn';
import DailyMode from './pages/DailyMode';
import Dashboard from './pages/Dashboard';
import EmergencyFund from './pages/EmergencyFund';
import Expenses from './pages/Expenses';
import FamilyMode from './pages/FamilyMode';
import Goals from './pages/Goals';
import Home from './pages/Home';
import Incomes from './pages/Incomes';
import MonthlyTrends from './pages/MonthlyTrends';
import Movements from './pages/Movements';
import Overview from './pages/Overview';
import Planning from './pages/Planning';
import Settings from './pages/Settings';
import SmartAnalysis from './pages/SmartAnalysis';
import TightMonth from './pages/TightMonth';
import Welcome from './pages/Welcome';
import Simulations from './pages/Simulations';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analysis": Analysis,
    "AutoPlanning": AutoPlanning,
    "BehaviorAnalysis": BehaviorAnalysis,
    "CategoryDistribution": CategoryDistribution,
    "ConsumptionPatterns": ConsumptionPatterns,
    "DailyCheckIn": DailyCheckIn,
    "DailyMode": DailyMode,
    "Dashboard": Dashboard,
    "EmergencyFund": EmergencyFund,
    "Expenses": Expenses,
    "FamilyMode": FamilyMode,
    "Goals": Goals,
    "Home": Home,
    "Incomes": Incomes,
    "MonthlyTrends": MonthlyTrends,
    "Movements": Movements,
    "Overview": Overview,
    "Planning": Planning,
    "Settings": Settings,
    "SmartAnalysis": SmartAnalysis,
    "TightMonth": TightMonth,
    "Welcome": Welcome,
    "Simulations": Simulations,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};