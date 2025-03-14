"use client";

import { useLinterSettings } from "@/store/useLinterSettings";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

export default function LinterSettings() {
  const { rules, toggleRule } = useLinterSettings();

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 p-4 border rounded-lg bg-white shadow">
      <h2 className="text-lg font-semibold mb-2">Linter Settings</h2>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Configure Rules <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Toggle Linting Rules</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(rules).map(([rule, enabled]) => (
            <DropdownMenuItem
              key={rule}
              onClick={() => toggleRule(rule as keyof typeof rules)}
              className="flex items-center justify-between"
            >
              <span className="capitalize">{rule.replace(/([A-Z])/g, " $1")}</span>
              {enabled && <Check className="h-4 w-4 text-green-600" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}