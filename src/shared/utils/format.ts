/**
 * Utilitários para formatação e normalização de strings (CPF, Telefone, etc.)
 */

export const maskCPF = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const maskPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    // (00) 0000-0000
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  // (00) 00000-0000
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

/**
 * Remove todos os caracteres não numéricos para salvar no banco.
 */
export const normalizeToDigits = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  return digits || null;
};
