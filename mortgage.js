/**
 * Mortgage Calculation Logic
 * Pure functions for financial simulations
 */

const Mortgage = {
    /**
     * Calculate the monthly interest rate from annual percentage
     * @param {number} annualRate - Annual interest rate in percent (e.g., 2.55)
     * @returns {number} Monthly rate as a decimal
     */
    getMonthlyRate: (annualRate) => {
        return annualRate / 12 / 100;
    },

    /**
     * Calculate monthly payment (annuity)
     * @param {number} principal - Loan amount
     * @param {number} monthlyRate - Monthly interest rate
     * @param {number} totalMonths - Total number of months
     * @returns {number} Monthly payment
     */
    calculateMonthlyPayment: (principal, monthlyRate, totalMonths) => {
        if (monthlyRate === 0) return principal / totalMonths;
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    },

    /**
     * Calculate the remaining number of months given a principal, payment, and rate
     * Derived from the annuity formula solving for n
     */
    calculateRemainingMonths: (principal, monthlyRate, payment) => {
        if (monthlyRate === 0) return principal / payment;
        // n = -log(1 - (r * P) / M) / log(1 + r)
        const numerator = Math.log(1 - (monthlyRate * principal) / payment);
        const denominator = Math.log(1 + monthlyRate);
        return -numerator / denominator;
    },

    /**
     * Simulate the mortgage evolution
     * @param {Object} params - { principal, annualRate, monthlyPayment, amortizationAmount, strategy }
     * @returns {Object} Simulation results { schedule, totalInterest, totalYears, totalPaid }
     */
    simulate: (params) => {
        const { principal, annualRate, monthlyPayment, amortizationAmount, strategy } = params;

        let balance = principal;
        let rate = Mortgage.getMonthlyRate(annualRate);
        let currentPayment = monthlyPayment;
        let totalInterest = 0;
        let totalPaid = 0;
        let months = 0;
        const schedule = [];

        // Safety break to prevent infinite loops
        const MAX_MONTHS = 1200; // 100 years

        while (balance > 0.01 && months < MAX_MONTHS) {
            months++;

            // 1. Calculate Interest for this month
            let interest = balance * rate;

            // 2. Calculate Principal portion
            // If payment is greater than balance + interest, just pay off the rest
            let payment = currentPayment;
            if (payment > balance + interest) {
                payment = balance + interest;
            }

            let principalPortion = payment - interest;

            // 3. Update accumulators
            totalInterest += interest;
            totalPaid += payment;
            balance -= principalPortion;

            // 4. Handle Annual Amortization (every 12 months)
            let extraPayment = 0;
            if (months % 12 === 0 && balance > 0 && amortizationAmount > 0) {
                extraPayment = amortizationAmount;
                if (extraPayment > balance) {
                    extraPayment = balance;
                }
                balance -= extraPayment;
                totalPaid += extraPayment;

                // Strategy Logic
                if (strategy === 'quota') {
                    // Recalculate monthly payment for the remaining term
                    // We need to know the original remaining term to keep it fixed?
                    // Usually "Reduce Quota" means keeping the original date.
                    // So we calculate the new payment to finish at the same target date.
                    // But we don't have the target date explicitly passed in this loop context easily without tracking "original total months".
                    // Simplified approach: Calculate remaining months based on CURRENT payment and balance, 
                    // then recalculate payment to match that term? No, that's circular.

                    // Correct approach for "Reduce Quota":
                    // The goal is to finish at the same time as if we hadn't amortized? 
                    // No, usually it means "Lower the monthly bill, keep the years the same".
                    // So we need to know how many months are left in the *original* schedule at this point?
                    // Actually, simpler: We need to know the *remaining* term.
                    // Let's estimate remaining term based on the *original* non-amortized path?
                    // Or better: The user usually has a fixed end date.
                    // Let's assume the "Reduce Quota" strategy tries to maintain the original amortization schedule's length.
                    // For this simulation, we can just assume the remaining term is (Total Original Months - Current Month).
                    // But we don't have Total Original Months here.

                    // Workaround: We will calculate the remaining n based on the *current* balance and *current* payment before amortization,
                    // then use that n to calculate the new payment with the *new* balance.

                    const remainingN = Mortgage.calculateRemainingMonths(balance + extraPayment, rate, currentPayment);
                    // Recalculate payment to clear 'balance' in 'remainingN' months
                    if (remainingN > 0) {
                        currentPayment = Mortgage.calculateMonthlyPayment(balance, rate, remainingN);
                    }
                }
                // If strategy is 'term', we do nothing to currentPayment. 
                // The extra payment naturally reduces the balance faster, thus reducing the term.
            }

            schedule.push({
                month: months,
                balance: Math.max(0, balance),
                interest: interest,
                payment: payment + extraPayment,
                accumulatedInterest: totalInterest
            });
        }

        return {
            schedule,
            totalInterest,
            totalYears: months / 12,
            totalPaid,
            finalMonth: months
        };
    },

    /**
     * Compare two scenarios
     * @param {Object} baseParams 
     * @param {Object} simParams 
     */
    compare: (baseParams, simParams) => {
        const base = Mortgage.simulate(baseParams);
        const sim = Mortgage.simulate(simParams);

        return {
            base,
            sim,
            savings: {
                interest: base.totalInterest - sim.totalInterest,
                years: base.totalYears - sim.totalYears,
                total: base.totalPaid - sim.totalPaid
            }
        };
    }
};

if (typeof module !== 'undefined') {
    module.exports = Mortgage;
}
