import { toDateKey, todayIso } from '../date';

describe('Date Utils', () => {
  describe('toDateKey', () => {
    it('deve converter corretamente uma data ignorando o timezone', () => {
      // Criando uma data fixa: 05/Maio/2026 00:00 local (Brasil)
      // Se fosse usado toISOString(), para GMT-3, viraria 2026-05-05T03:00Z.
      // Se a data fosse 04/Maio/2026 22:00 local, toISOString() viraria 2026-05-05T01:00Z.
      
      const date1 = new Date(2026, 4, 5, 0, 0, 0); // 5 de Maio de 2026
      expect(toDateKey(date1)).toBe('2026-05-05');

      const date2 = new Date(2026, 11, 31, 23, 59, 59); // 31 de Dezembro de 2026
      expect(toDateKey(date2)).toBe('2026-12-31');

      const date3 = new Date(2026, 0, 1, 12, 0, 0); // 1 de Janeiro de 2026
      expect(toDateKey(date3)).toBe('2026-01-01');
    });
  });

  describe('todayIso', () => {
    it('deve retornar a data atual local no formato YYYY-MM-DD', () => {
      const todayString = todayIso();
      expect(todayString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      const now = new Date();
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      expect(todayString).toBe(expected);
    });
  });
});
