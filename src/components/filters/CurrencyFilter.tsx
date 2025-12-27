"use client";

import FilterDropdown from "./FilterDropdown";
import FilterCheckboxList from "./FilterCheckboxList";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface CurrencyFilterProps {
  selectedCurrencies: string[];
  onCurrenciesChange: (currencies: string[]) => void;
  onOpenChange?: (open: boolean) => void;
  onApply?: () => void;
  isActive?: boolean;
}

// Currency data with flags
const currencies = [
  { code: "USD", symbol: "$", flag: "us", name: "Dollar américain" },
  { code: "EUR", symbol: "€", flag: "eu", name: "Euro" },
  { code: "GBP", symbol: "£", flag: "gb", name: "Livre sterling" },
  { code: "CAD", symbol: "C$", flag: "ca", name: "Dollar canadien" },
  { code: "AUD", symbol: "A$", flag: "au", name: "Dollar australien" },
  { code: "CHF", symbol: "₣", flag: "ch", name: "Franc suisse" },
  { code: "JPY", symbol: "¥", flag: "jp", name: "Yen japonais" },
  { code: "CNY", symbol: "¥", flag: "cn", name: "Yuan chinois" },
  { code: "INR", symbol: "₹", flag: "in", name: "Roupie indienne" },
  { code: "BRL", symbol: "R$", flag: "br", name: "Real brésilien" },
  { code: "MXN", symbol: "Mex$", flag: "mx", name: "Peso mexicain" },
  { code: "KRW", symbol: "₩", flag: "kr", name: "Won coréen" },
  { code: "SEK", symbol: "kr", flag: "se", name: "Couronne suédoise" },
  { code: "NOK", symbol: "kr", flag: "no", name: "Couronne norvégienne" },
  { code: "DKK", symbol: "kr", flag: "dk", name: "Couronne danoise" },
  { code: "PLN", symbol: "zł", flag: "pl", name: "Zloty polonais" },
  { code: "NZD", symbol: "NZ$", flag: "nz", name: "Dollar néo-zélandais" },
  { code: "SGD", symbol: "S$", flag: "sg", name: "Dollar singapourien" },
  { code: "HKD", symbol: "HK$", flag: "hk", name: "Dollar hongkongais" },
  { code: "TRY", symbol: "₺", flag: "tr", name: "Livre turque" },
  { code: "AED", symbol: "د.إ", flag: "ae", name: "Dirham émirati" },
  { code: "SAR", symbol: "ر.س", flag: "sa", name: "Riyal saoudien" },
  { code: "MAD", symbol: "د.م", flag: "ma", name: "Dirham marocain" },
  { code: "ZAR", symbol: "R", flag: "za", name: "Rand sud-africain" },
  { code: "THB", symbol: "฿", flag: "th", name: "Baht thaïlandais" },
  { code: "IDR", symbol: "Rp", flag: "id", name: "Roupie indonésienne" },
  { code: "MYR", symbol: "RM", flag: "my", name: "Ringgit malaisien" },
  { code: "PHP", symbol: "₱", flag: "ph", name: "Peso philippin" },
  { code: "VND", symbol: "₫", flag: "vn", name: "Dong vietnamien" },
  { code: "CZK", symbol: "Kč", flag: "cz", name: "Couronne tchèque" },
  { code: "HUF", symbol: "Ft", flag: "hu", name: "Forint hongrois" },
  { code: "RON", symbol: "lei", flag: "ro", name: "Leu roumain" },
];

export default function CurrencyFilter({ 
  selectedCurrencies, 
  onCurrenciesChange,
  onOpenChange,
  onApply,
  isActive = false
}: CurrencyFilterProps) {

  const currenciesWithFlags = currencies.map(currency => ({
    id: currency.code,
    label: `${currency.code} (${currency.symbol})`,
    icon: (
      <Image 
        src={`/flags/${currency.flag}.svg`} 
        alt={currency.name} 
        width={20} 
        height={15}
        className="rounded"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    )
  }));

  return (
    <FilterDropdown
      label="Devise"
      icon="ri-money-euro-circle-line"
      onOpenChange={onOpenChange}
      isActive={isActive || selectedCurrencies.length > 0}
      badge={selectedCurrencies.length > 0 ? selectedCurrencies.length : undefined}
    >
      <p className="fw-500 mb-2">Devise</p>

      <FilterCheckboxList
        items={currenciesWithFlags}
        selectedItems={selectedCurrencies}
        onItemsChange={onCurrenciesChange}
        searchPlaceholder="Rechercher une devise..."
        showIncludeExclude={true}
        groupName="currencyCheckboxes"
      />

      <Button 
        className="w-100 mt-3" 
        onClick={() => onApply?.()}
      >
        Appliquer
      </Button>
    </FilterDropdown>
  );
}
