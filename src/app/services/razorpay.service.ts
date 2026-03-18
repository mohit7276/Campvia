import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayPaymentResult {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

@Injectable({ providedIn: 'root' })
export class RazorpayService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;
  private checkoutScriptPromise: Promise<void> | null = null;

  /** Load checkout.js only when needed to avoid noisy preload warnings on page load. */
  private ensureCheckoutScriptLoaded(): Promise<void> {
    if (window.Razorpay) {
      return Promise.resolve();
    }

    if (this.checkoutScriptPromise) {
      return this.checkoutScriptPromise;
    }

    this.checkoutScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-rzp-checkout="1"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay checkout script')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-rzp-checkout', '1');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
      document.head.appendChild(script);
    });

    return this.checkoutScriptPromise;
  }

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  /**
   * Creates a Razorpay order on the backend, then opens the native
   * Razorpay Checkout modal.  Resolves with the payment response on
   * success, rejects if the user dismisses or an error occurs.
   */
  openCheckout(options: {
    amount: number;
    courseName: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
  }): Promise<RazorpayPaymentResult> {
    // 1. Load checkout script and create order via backend
    return this.ensureCheckoutScriptLoaded().then(() => firstValueFrom(
      this.http.post<RazorpayOrderResponse>(
        `${this.baseUrl}/payment/create-order`,
        { amount: options.amount },
        { headers: this.getHeaders() }
      )
    )).then((order) => {
      // 2. Open native Razorpay Checkout
      return new Promise<RazorpayPaymentResult>((resolve, reject) => {
        const rzpOptions = {
          key: order.keyId,
          amount: order.amount,           // already in paise from backend
          currency: order.currency,
          name: 'Campvia University',
          description: `Fee Payment — ${options.courseName}`,
          // Do NOT pass a localhost URL here — Razorpay's iframe runs on https://api.razorpay.com
          // and the browser will block any attempt to load a http://localhost image (CORS + mixed content).
          // Razorpay will fall back to a Campvia-branded default image automatically.
          order_id: order.orderId,
          handler: (response: RazorpayPaymentResult) => {
            resolve(response);
          },
          prefill: {
            name: options.userName,
            email: options.userEmail,
            contact: options.userPhone || '',
          },
          notes: {
            course: options.courseName,
          },
          theme: {
            color: '#2563eb',
            backdrop_color: 'rgba(15,23,42,0.75)',
          },
          modal: {
            backdropclose: false,
            escape: true,
            handleback: true,
            confirm_close: true,
            ondismiss: () => {
              reject(new Error('cancelled'));
            },
          },
        };

        try {
          const RazorpayCtor = window.Razorpay;
          if (!RazorpayCtor) {
            reject(new Error('Razorpay checkout is not available'));
            return;
          }
          const rzp = new RazorpayCtor(rzpOptions);
          rzp.on('payment.failed', (response: any) => {
            reject(new Error(response?.error?.description || 'Payment failed'));
          });
          rzp.open();
        } catch (err: any) {
          reject(new Error(err?.message || 'Could not open Razorpay checkout'));
        }
      });
    });
  }

  /**
   * Sends Razorpay's payment response to our backend for HMAC-SHA256
   * signature verification and marks all pending fees as paid.
   */
  verifyPayment(paymentDetails: RazorpayPaymentResult): Promise<any> {
    return firstValueFrom(
      this.http.post(
        `${this.baseUrl}/payment/verify`,
        paymentDetails,
        { headers: this.getHeaders() }
      )
    );
  }

  // ── Helpers (kept for display / validation UI) ──────────────────

  /** Generate a realistic-looking Razorpay payment ID for demo displays */
  generatePaymentId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'pay_';
    for (let i = 0; i < 14; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  /** Luhn-algorithm card number validation */
  validateCardNumber(num: string): boolean {
    const digits = num.replace(/\s/g, '');
    if (!/^\d{16}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      let d = parseInt(digits[digits.length - 1 - i], 10);
      if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    return sum % 10 === 0;
  }

  /** Validate MM/YY expiry is in the future */
  validateExpiry(expiry: string): boolean {
    const match = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!match) return false;
    const month = parseInt(match[1], 10);
    const year = 2000 + parseInt(match[2], 10);
    const now = new Date();
    return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
  }

  /** Validate 3-digit CVV */
  validateCvv(cvv: string): boolean {
    return /^\d{3}$/.test(cvv);
  }

  /** Detect card network from leading digits */
  detectNetwork(num: string): string {
    const d = num.replace(/\s/g, '');
    if (/^4/.test(d)) return 'visa';
    if (/^5[1-5]/.test(d)) return 'mastercard';
    if (/^6(?:011|5)/.test(d)) return 'rupay';
    if (/^3[47]/.test(d)) return 'amex';
    return '';
  }
}

