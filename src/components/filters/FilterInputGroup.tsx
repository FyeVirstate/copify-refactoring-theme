"use client";

import { Input } from "@/components/ui/input";

interface FilterInputGroupProps {
  label: string;
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  symbol?: string;
  symbolPosition?: "start" | "end";
}

export default function FilterInputGroup({
  label,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
  symbol,
  symbolPosition = "end",
}: FilterInputGroupProps) {
  return (
    <div className="mb-3">
      <label className="fs-small text-sub mb-2 d-block fw-500">{label}</label>
      <div className="d-flex gap-2">
        {symbol && symbolPosition === "start" ? (
          <div className="input-with-symbol-start w-100">
            <span className="symbol"><i className={symbol}></i></span>
            <Input
              type="number"
              className="form-control design-2"
              placeholder={minPlaceholder}
              value={minValue}
              onChange={(e) => onMinChange(e.target.value)}
            />
          </div>
        ) : (
          <div className={symbol ? "input-with-symbol-end w-100" : "w-100"}>
            <Input
              type="number"
              className="form-control design-2"
              placeholder={minPlaceholder}
              value={minValue}
              onChange={(e) => onMinChange(e.target.value)}
            />
            {symbol && <span className="symbol"><i className={symbol}></i></span>}
          </div>
        )}
        
        {symbol && symbolPosition === "start" ? (
          <div className="input-with-symbol-start w-100">
            <span className="symbol"><i className={symbol}></i></span>
            <Input
              type="number"
              className="form-control design-2"
              placeholder={maxPlaceholder}
              value={maxValue}
              onChange={(e) => onMaxChange(e.target.value)}
            />
          </div>
        ) : (
          <div className={symbol ? "input-with-symbol-end w-100" : "w-100"}>
            <Input
              type="number"
              className="form-control design-2"
              placeholder={maxPlaceholder}
              value={maxValue}
              onChange={(e) => onMaxChange(e.target.value)}
            />
            {symbol && <span className="symbol"><i className={symbol}></i></span>}
          </div>
        )}
      </div>
    </div>
  );
}

