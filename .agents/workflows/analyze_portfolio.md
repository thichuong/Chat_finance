# Portfolio Analysis Workflow

This workflow is used to conduct a systematic analysis of a user's financial portfolio.

## 🗒️ Steps

1. **Collect Portfolio Data**: Retrieve current holdings, buy prices, and quantities.
2. **Fetch Current Market Prices**: Use the real-time stock tool to get latest valuation.
3. **Calculate Valuation**: Compute current portfolio value and total P/L.
4. **Identify Trends**: Analyze historical performance of individual assets.
5. **Generate Insights**: Produce a summary of sector concentration and risk.
6. **Report to User**: Present findings in a structured, actionable format.

## 💡 Best Practices

- Cache frequently accessed data for 15 minutes.
- Flag assets with >20% volatility over 30 days.
- Suggest diversification if a single sector exceeds 30% of portfolio.
