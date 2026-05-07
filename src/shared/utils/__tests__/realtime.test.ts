import { uniqueChannelName } from '../realtime';

describe('Realtime Utils', () => {
  describe('uniqueChannelName', () => {
    it('deve gerar um nome de canal unico sem colisoes', () => {
      const channel1 = uniqueChannelName('test', 'id123');
      const channel2 = uniqueChannelName('test', 'id123');

      expect(channel1).not.toBe(channel2); // Must be unique even with same inputs
      expect(channel1).toMatch(/^test-id123-\d+-[a-z0-9]+$/);
    });

    it('deve gerar sem identificador caso nao seja fornecido', () => {
      const channel = uniqueChannelName('global');
      expect(channel).toMatch(/^global-\d+-[a-z0-9]+$/);
    });
  });
});
