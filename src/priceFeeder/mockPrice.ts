const mockDotPrice = (): string => '200.0';
const mockAcalaPrice = (): string => '100.0';

const mockPrice = (symbol: string): null | string => {
  if (symbol === 'DOTUSD') {
    return mockDotPrice();
  }

  if (symbol === 'ACAUSD') {
    return mockAcalaPrice();
  }

  return null;
};

export default mockPrice;
