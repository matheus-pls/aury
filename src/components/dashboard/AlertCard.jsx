import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Info, CheckCircle, XCircle, ChevronRight } from "lucide-react";

export default function AlertCard({ alerts }) {
  const getAlertConfig = (type) => {
    switch (type) {
      case "danger":
        return { 
          icon: XCircle, 
          bg: "bg-red-50", 
          border: "border-red-200",
          iconColor: "text-red-500",
          textColor: "text-red-700"
        };
      case "warning":
        return { 
          icon: AlertTriangle, 
          bg: "bg-amber-50", 
          border: "border-amber-200",
          iconColor: "text-amber-500",
          textColor: "text-amber-700"
        };
      case "success":
        return { 
          icon: CheckCircle, 
          bg: "bg-emerald-50", 
          border: "border-emerald-200",
          iconColor: "text-emerald-500",
          textColor: "text-emerald-700"
        };
      default:
        return { 
          icon: Info, 
          bg: "bg-blue-50", 
          border: "border-blue-200",
          iconColor: "text-blue-500",
          textColor: "text-blue-700"
        };
    }
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-500" />
          <div>
            <p className="font-medium text-emerald-700">Tudo certo!</p>
            <p className="text-sm text-emerald-600">Suas finanças estão organizadas.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => {
        const config = getAlertConfig(alert.type);
        const Icon = config.icon;
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${config.bg} ${config.border} border rounded-xl p-4`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${config.textColor}`}>{alert.title}</p>
                <p className={`text-sm ${config.textColor} opacity-80 mt-0.5`}>{alert.message}</p>
              </div>
              {alert.action && (
                <button className={`flex items-center gap-1 text-sm font-medium ${config.textColor} hover:underline`}>
                  {alert.action}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}