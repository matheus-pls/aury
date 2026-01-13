import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BackButton({ to, className = "" }) {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`gap-2 text-slate-600 hover:text-[#1B3A52] hover:bg-slate-100 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      Voltar
    </Button>
  );
}