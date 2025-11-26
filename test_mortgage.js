const Mortgage = require('./mortgage.js');

const baseParams = {
    principal: 95018,
    annualRate: 2.55,
    monthlyPayment: 407.43,
    amortizationAmount: 0,
    strategy: 'term'
};

console.log("--- BASE CASE ---");
const base = Mortgage.simulate(baseParams);
console.log(`Total Interest: ${base.totalInterest.toFixed(2)}`);
console.log(`Total Years: ${base.totalYears.toFixed(2)}`);
console.log(`Final Month: ${base.finalMonth}`);

console.log("\n--- AMORTIZATION 1000€/Year (Reduce Term) ---");
const simTerm = Mortgage.simulate({ ...baseParams, amortizationAmount: 1000, strategy: 'term' });
console.log(`Total Interest: ${simTerm.totalInterest.toFixed(2)}`);
console.log(`Total Years: ${simTerm.totalYears.toFixed(2)}`);
console.log(`Savings: ${(base.totalInterest - simTerm.totalInterest).toFixed(2)}`);

console.log("\n--- AMORTIZATION 1000€/Year (Reduce Quota) ---");
const simQuota = Mortgage.simulate({ ...baseParams, amortizationAmount: 1000, strategy: 'quota' });
console.log(`Total Interest: ${simQuota.totalInterest.toFixed(2)}`);
console.log(`Total Years: ${simQuota.totalYears.toFixed(2)}`);
console.log(`Savings: ${(base.totalInterest - simQuota.totalInterest).toFixed(2)}`);
