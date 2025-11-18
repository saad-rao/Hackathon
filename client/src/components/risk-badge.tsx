import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, AlertCircle } from "lucide-react";

interface RiskBadgeProps {
  level: "low" | "medium" | "high";
  showIcon?: boolean;
}

export function RiskBadge({ level, showIcon = true }: RiskBadgeProps) {
  const config = {
    low: {
      label: "Low Risk",
      className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
      icon: Shield,
    },
    medium: {
      label: "Medium Risk",
      className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
      icon: AlertTriangle,
    },
    high: {
      label: "High Risk",
      className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      icon: AlertCircle,
    },
  };

  const { label, className, icon: Icon } = config[level];

  return (
    <Badge variant="outline" className={className} data-testid={`badge-risk-${level}`}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {label}
    </Badge>
  );
}
