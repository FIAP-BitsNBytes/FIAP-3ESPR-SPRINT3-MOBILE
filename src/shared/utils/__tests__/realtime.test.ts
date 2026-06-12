import { uniqueChannelName } from '../realtime';

describe('Realtime Utils', () => {
  describe('uniqueChannelName', () => {
    it('deve gerar um nome de canal unico sem colisoes', () => {
      const channel1 = uniqueChannelName('test', 'id123');
      const channel2 = uniqueChannelName('test', 'id123');

      expect(channel1).not.toBe(channel2); // Must be unique even with same inputs
      // Formato: prefix-identifier-timestamp-counter-random
      expect(channel1).toMatch(/^test-id123-\d+-\d+-[a-z0-9]+$/);
    });

    it('deve gerar sem identificador caso nao seja fornecido', () => {
      const channel = uniqueChannelName('global');
      expect(channel).toMatch(/^global-\d+-\d+-[a-z0-9]+$/);
    });

    it('deve gerar nomes unicos para 1000 chamadas no mesmo tick (Date.now identico)', () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1718000000000);

      try {
        const names = new Set<string>();
        for (let i = 0; i < 1000; i += 1) {
          names.add(uniqueChannelName('burst', 'same-id'));
        }

        // O contador monotonico garante unicidade mesmo sem variacao de timestamp
        // e independente de colisoes do sufixo aleatorio.
        expect(names.size).toBe(1000);
      } finally {
        nowSpy.mockRestore();
      }
    });

    it('deve manter o contador crescente entre chamadas consecutivas', () => {
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1718000000000);

      try {
        const extractCounter = (name: string): number => {
          const match = name.match(/^seq-\d+-(\d+)-[a-z0-9]+$/);
          expect(match).not.toBeNull();
          return Number(match?.[1]);
        };

        const first = extractCounter(uniqueChannelName('seq'));
        const second = extractCounter(uniqueChannelName('seq'));
        const third = extractCounter(uniqueChannelName('seq'));

        expect(second).toBe(first + 1);
        expect(third).toBe(second + 1);
      } finally {
        nowSpy.mockRestore();
      }
    });
  });
});
