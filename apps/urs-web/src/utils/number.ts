

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    currency: "IDR",
    style: "currency",
  }).format(value);
};
