import crypto from 'crypto';

interface ZpayPaymentParams {
  pid: string;
  money: string;
  name: string;
  notify_url: string;
  out_trade_no: string;
  return_url: string;
  sitename?: string;
  type: 'alipay' | 'wxpay' | 'qqpay' | 'tenpay';
  cid?: string;
  param?: string;
}

interface ZpayNotifyParams {
  pid: string;
  name: string;
  money: string;
  out_trade_no: string;
  trade_no: string;
  param?: string;
  trade_status: string;
  type: string;
  sign: string;
  sign_type: string;
}

// Sort parameters and create a query string
export function getVerifyParams(params: Record<string, any>): string {
  const filteredParams: [string, any][] = [];
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '' && key !== 'sign' && key !== 'sign_type') {
      // For numeric values that might be decimal, ensure consistent formatting
      let value = params[key];
      if (key === 'money' && !isNaN(parseFloat(value))) {
        // Ensure money is formatted consistently to avoid decimal precision issues
        value = parseFloat(value).toString();
      }
      filteredParams.push([key, value]);
    }
  });
  
  // Sort by parameter name (ASCII order)
  filteredParams.sort();
  
  // Build query string - join all parameters with &
  return filteredParams.map(([key, value]) => `${key}=${value}`).join('&');
}

// Generate MD5 sign
export function generateSign(params: Record<string, any>, key: string): string {
  const queryString = getVerifyParams(params);
  console.log('Params for signing:', params);
  console.log('Query string for signing:', queryString);
  console.log('Key for signing:', key);
  const signResult = crypto.createHash('md5').update(queryString + key).digest('hex').toLowerCase();
  console.log('Generated sign:', signResult);
  return signResult;
}

// Verify the signature from callback
export function verifySign(params: Record<string, any>, key: string): boolean {
  const providedSign = params.sign;
  const calculatedSign = generateSign(params, key);
  console.log('Provided sign:', providedSign);
  console.log('Calculated sign:', calculatedSign);
  return providedSign === calculatedSign;
}

// Generate payment URL
export function generatePaymentUrl(
  params: ZpayPaymentParams, 
  key: string
): string {
  const sign = generateSign(params, key);
  const queryString = getVerifyParams(params);
  return `https://zpayz.cn/submit.php?${queryString}&sign=${sign}&sign_type=MD5`;
}

// Generate a unique order number
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 900) + 100; // Random 3-digit number
  
  return `${year}${month}${day}${hours}${minutes}${seconds}${random}`;
}

// Export configuration
export const ZPAY_CONFIG = {
  PID: process.env.ZPAY_PID || '',
  KEY: process.env.ZPAY_KEY || '',
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
}; 