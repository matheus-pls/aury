import React, { useState } from "react";
import { Lock, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import UpgradeModal from "./UpgradeModal";

export default function FeatureLockedCard({ title, description, icon: Icon }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-100/50" />
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-slate-200 flex items-center justify-center opacity-50">
              {Icon && <Icon className="w-6 h-6 text-slate-400" />}
            </div>
            <Lock className="w-5 h-5 text-slate-400" />
          </div>
          
          <h3 className="font-bold text-slate-400 mb-2">{title}</h3>
          <p className="text-sm text-slate-400 mb-4">{description}</p>
          
          <Button
            onClick={() => setShowModal(true)}
            size="sm"
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:opacity-90"
          >
            <Crown className="w-4 h-4 mr-2" />
            Desbloquear com Premium
          </Button>
        </CardContent>
      </Card>

      <UpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={title}
      />
    </>
  );
}