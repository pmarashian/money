export const AI_ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    automated_payments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          vendor: { type: 'string' },
          amount: { type: 'number' },
          frequency: {
            type: 'string',
            enum: ['monthly', 'bi-weekly', 'weekly', 'quarterly', 'annual']
          },
          last_occurrence: { type: 'string', format: 'date-time' },
          category: {
            type: 'string',
            enum: ['rent', 'utilities', 'investments', 'media', 'other']
          }
        },
        required: ['vendor', 'amount', 'frequency', 'last_occurrence', 'category'],
        additionalProperties: false
      }
    },
    anomalies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          transaction_index: { type: 'integer', minimum: 0 },
          reason: { type: 'string' }
        },
        required: ['transaction_index', 'reason'],
        additionalProperties: false
      }
    },
    paychecks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          transaction_index: { type: 'integer', minimum: 0 },
          amount: { type: 'number' },
          date: { type: 'string', format: 'date-time' },
          is_bonus: { type: 'boolean' }
        },
        required: ['transaction_index', 'amount', 'date', 'is_bonus'],
        additionalProperties: false
      }
    },
    bonuses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          transaction_index: { type: 'integer', minimum: 0 },
          amount: { type: 'number' },
          date: { type: 'string', format: 'date-time' }
        },
        required: ['transaction_index', 'amount', 'date'],
        additionalProperties: false
      }
    },
    categories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          transaction_index: { type: 'integer', minimum: 0 },
          category: {
            type: 'string',
            enum: ['rent', 'utilities', 'investments', 'media', 'groceries', 'dining', 'transportation', 'entertainment', 'healthcare', 'shopping', 'subscriptions', 'insurance', 'other']
          },
          confidence: { type: 'number', minimum: 0, maximum: 1 }
        },
        required: ['transaction_index', 'category', 'confidence'],
        additionalProperties: false
      }
    }
  },
  required: ['automated_payments', 'anomalies', 'paychecks', 'bonuses', 'categories'],
  additionalProperties: false
};
