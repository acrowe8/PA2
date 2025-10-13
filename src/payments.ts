import { Router, Request, Response } from 'express';

export const paymentsRouter = Router();

function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

paymentsRouter.post('/payments/validate-card', (req: Request, res: Response) => {
  const { cardNumber } = req.body as { cardNumber?: string };
  if (!cardNumber) return res.status(400).json({ valid: false, error: 'Missing cardNumber' });
  const valid = luhnCheck(cardNumber);
  res.json({ valid });
});
