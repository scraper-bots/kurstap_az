import crypto from 'crypto'

export interface EpointPaymentRequest {
  public_key: string
  amount: number
  currency: string
  language: string
  order_id: string
  description?: string
  success_redirect_url?: string
  error_redirect_url?: string
  other_attr?: any[]
}

export interface EpointPaymentResponse {
  status: 'success' | 'error'
  transaction?: string
  redirect_url?: string
  error?: string
}

export interface EpointPaymentResult {
  order_id: string
  status: 'success' | 'failed'
  code: string
  message: string
  transaction: string
  bank_transaction?: string
  bank_response?: string
  operation_code: string
  rrn?: string
  card_name?: string
  card_mask?: string
  amount: number
  other_attr?: any
}

export class EpointService {
  private static readonly API_BASE_URL = 'https://epoint.az/api/1'
  private static readonly PUBLIC_KEY = process.env.EPOINT_OPEN_KEY!
  private static readonly PRIVATE_KEY = process.env.EPOINT_PERSONAL_TOKEN!

  private static generateSignature(data: string): string {
    const signatureString = this.PRIVATE_KEY + data + this.PRIVATE_KEY
    const hash = crypto.createHash('sha1').update(signatureString, 'binary').digest('hex')
    return Buffer.from(hash, 'hex').toString('base64')
  }

  private static encodeData(payload: any): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }

  private static decodeData(data: string): any {
    return JSON.parse(Buffer.from(data, 'base64').toString())
  }

  private static async makeRequest(endpoint: string, payload: any): Promise<any> {
    const data = this.encodeData(payload)
    const signature = this.generateSignature(data)

    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, signature })
    })

    if (!response.ok) {
      throw new Error(`Epoint API error: ${response.status}`)
    }

    return response.json()
  }

  static async initiatePayment(paymentData: EpointPaymentRequest): Promise<EpointPaymentResponse> {
    try {
      const payload = {
        public_key: this.PUBLIC_KEY,
        amount: paymentData.amount,
        currency: paymentData.currency,
        language: paymentData.language,
        order_id: paymentData.order_id,
        description: paymentData.description,
        success_redirect_url: paymentData.success_redirect_url,
        error_redirect_url: paymentData.error_redirect_url,
        other_attr: paymentData.other_attr
      }

      const response = await this.makeRequest('/checkout', payload)
      
      return {
        status: response.status,
        transaction: response.transaction,
        redirect_url: response.redirect_url,
        error: response.error
      }
    } catch (error) {
      console.error('Epoint payment initiation error:', error)
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  static async checkPaymentStatus(transactionId: string): Promise<EpointPaymentResult | null> {
    try {
      const payload = {
        public_key: this.PUBLIC_KEY,
        transaction: transactionId
      }

      const response = await this.makeRequest('/get-status', payload)
      
      if (response.status === 'success' && response.data) {
        return this.decodeData(response.data) as EpointPaymentResult
      }
      
      return null
    } catch (error) {
      console.error('Epoint status check error:', error)
      return null
    }
  }

  static verifyCallback(data: string, signature: string): { isValid: boolean; result?: EpointPaymentResult } {
    try {
      // Verify signature
      const expectedSignature = this.generateSignature(data)
      
      if (signature !== expectedSignature) {
        return { isValid: false }
      }

      // Decode and return payment result
      const result = this.decodeData(data) as EpointPaymentResult
      return { isValid: true, result }
    } catch (error) {
      console.error('Epoint callback verification error:', error)
      return { isValid: false }
    }
  }

  static formatAmount(amount: number): number {
    // Ensure amount is in the correct format for Epoint (with decimals)
    return Math.round(amount * 100) / 100
  }

  static getStatusMessage(code: string): string {
    const statusCodes: Record<string, string> = {
      '000': 'Confirmed',
      '100': 'Rejected (general)',
      '101': 'Declined, your card has expired',
      '102': 'Rejected, suspected fraud',
      '103': 'Rejected, cardholder will contact acquirer',
      '104': 'Rejected, Restricted Card',
      '105': 'Rejected, Card Receiver will contact Acquirer Security',
      '106': 'Rejected, PIN attempts exceeded',
      '107': 'Declined, please contact your card issuer',
      '108': 'Declined, please refer to card issuer\'s special terms',
      '109': 'Rejected, invalid merchant',
      '110': 'Rejected, incorrect amount',
      '111': 'Rejected, incorrect card number',
      '112': 'Rejected, PIN required',
      '113': 'Denied, inappropriate payment',
      '114': 'Rejected, no account of the requested type',
      '115': 'Denied, requested function is not supported',
      '116': 'Declined, insufficient funds',
      '117': 'Rejected, incorrect PIN',
      '118': 'Rejected, no card data',
      '119': 'Rejected, transaction not allowed by cardholder',
      '120': 'Rejected, transaction not allowed to terminal',
      '121': 'Declined, withdrawal limit exceeded',
      '122': 'Rejected, Safety Violation',
      '123': 'Declined, withdrawal limit exceeded',
      '124': 'Rejected, violation of the law',
      '125': 'Rejected, card not valid'
    }

    return statusCodes[code] || `Unknown status code: ${code}`
  }
}