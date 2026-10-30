const SINGULAR_UNITS: Record<string, string> = {
  unidades: 'unidad',
  litros: 'litro',
  paquetes: 'paquete',
  latas: 'lata',
};

export function formatQuantity(quantity: number, unit: string): string {
  const label = quantity === 1 ? (SINGULAR_UNITS[unit] ?? unit) : unit;
  return `${quantity.toLocaleString('es-ES')} ${label}`;
}
