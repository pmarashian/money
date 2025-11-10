// AI analysis prompts for different use cases

export const ANALYSIS_PROMPTS = {
  transactionAnalysis: (transactions: any[], context: any) => `
Analyze the following bank transactions and categorize them appropriately.

Context:
- Paycheck deposits: ${context.paycheckAmount ? `~$${context.paycheckAmount}` : 'variable amounts'} every 2 weeks
- Bonus deposits: ${context.bonusMin && context.bonusMax ? `$${context.bonusMin}-$${context.bonusMax}` : 'variable amounts'} quarterly
- Account is used for automated payments (rent, utilities, etc.)

Transactions to analyze:
${JSON.stringify(transactions.slice(0, 50), null, 2)} ${transactions.length > 50 ? `\n... and ${transactions.length - 50} more transactions` : ''}

Please identify:
1. Recurring automated payments (rent, utilities, subscriptions, etc.)
2. Paycheck deposits
3. Bonus deposits
4. One-time or anomalous transactions
5. Transaction categories

Return your analysis as a structured JSON response.
`,

  spendingByCategory: (transactions: any[], categories: string[]) => `
Analyze spending patterns from these transactions and provide insights by category.

Categories to analyze: ${categories.join(', ')}

Transactions:
${JSON.stringify(transactions, null, 2)}

Provide:
1. Total spending by category
2. Trends and patterns
3. Unusual spending in any category
4. Recommendations for cost optimization
`,

  financialOutlook: (currentBalance: number, automatedPayments: any[], nextBonusDate: string) => `
Based on the current financial data, provide an outlook analysis.

Current balance: $${currentBalance}
Next bonus date: ${nextBonusDate}
Automated payments: ${JSON.stringify(automatedPayments, null, 2)}

Analyze:
1. Days until next bonus
2. Expected expenses until bonus
3. Surplus/deficit projection
4. Risk assessment
5. Recommendations
`,
};

export const SYSTEM_PROMPTS = {
  financialAnalyst: `You are an expert financial analyst specializing in personal finance management and transaction analysis. You help users understand their spending patterns, identify recurring expenses, and optimize their financial planning.

Key principles:
- Be conservative and accurate in your analysis
- Focus on actionable insights
- Consider both short-term and long-term financial health
- Be transparent about uncertainties in the data
- Provide clear, jargon-free explanations`,

  transactionCategorizer: `You are a transaction categorization expert. Your role is to accurately categorize bank transactions into appropriate expense categories based on merchant names, transaction descriptions, and patterns.

Guidelines:
- Use the provided category list when possible
- Be specific but not overly granular
- Consider context and common merchant categorizations
- Flag uncertain categorizations with lower confidence scores
- Look for patterns in transaction descriptions`,
};
