// fixIncorrectProfits.js
import mongoose from 'mongoose';
import SharePurchase from './model/SharePurchase.js';
import UserMachine from './model/UserMAchine.js';
import Balance from './model/Balance.js';
import Transaction from './model/withdrawals.js';

/**
 * REVERSES incorrectly paid profits from the bugged cron
 * (when it was set to pay every 5 minutes instead of 30 days)
 */
export const fixIncorrectProfits = async () => {
  const session = await mongoose.startSession();
  let totalReversed = 0;
  let usersFixed = 0;

  try {
    await session.withTransaction(async () => {
      console.log('\n[FIX] Starting profit reversal...\n');

      // ============ SHARES ============
      console.log('[FIX] === Reversing SHARE profits ===');
      const shares = await SharePurchase.find({
        totalProfitEarned: { $gt: 0 },
      }).session(session);

      for (const share of shares) {
        const purchaseDate = new Date(share.purchaseDate);
        const currentDate = new Date();

        const daysSincePurchase = Math.floor(
          (currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // ✅ If less than 30 days AND has profit earned → it's the bug payout
        if (daysSincePurchase < 30 && share.totalProfitEarned > 0) {
          const incorrectAmount = share.totalProfitEarned;

          console.log(
            `[FIX] Share ${share._id} - Purchased ${daysSincePurchase} days ago, reversing $${incorrectAmount}`
          );

          // Reset share record
          share.totalProfitEarned = 0;
          share.lastProfitUpdate = purchaseDate; // reset to purchase date
          await share.save({ session });

          // Deduct from user balance
          const userBalance = await Balance.findOne({
            user: share.user,
          }).session(session);

          if (userBalance) {
            const oldTotal = userBalance.totalBalance;
            userBalance.miningBalance = Math.max(
              0,
              userBalance.miningBalance - incorrectAmount
            );
            userBalance.totalBalance =
              userBalance.adminAdd + userBalance.miningBalance;
            await userBalance.save({ session });

            // Log reversal transaction
            await Transaction.create(
              [
                {
                  user: share.user,
                  amount: incorrectAmount,
                  type: 'SHARE_PROFIT',
                  status: 'completed',
                  balanceBefore: oldTotal,
                  balanceAfter: userBalance.totalBalance,
                  details: `[REVERSAL] Incorrect early profit payout for shares ${share._id} — reversed`,
                  transactionDate: currentDate,
                  metadata: {
                    reversal: true,
                    shareId: share._id,
                    reversedAmount: incorrectAmount,
                    reason: 'Cron paid before 30 days due to test config',
                  },
                },
              ],
              { session }
            );

            totalReversed += incorrectAmount;
            usersFixed++;

            console.log(
              `[FIX] ✅ Reversed $${incorrectAmount} from user ${share.user}`
            );
          }
        }
      }

      // ============ NORMAL MACHINES ============
      console.log('\n[FIX] === Reversing MACHINE profits ===');
      const userMachines = await UserMachine.find({
        monthlyProfitAccumulated: { $gt: 0 },
      }).session(session);

      for (const machine of userMachines) {
        const assignedDate = new Date(machine.assignedDate);
        const currentDate = new Date();

        const daysSinceAssigned = Math.floor(
          (currentDate.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceAssigned < 30 && machine.monthlyProfitAccumulated > 0) {
          const incorrectAmount = machine.monthlyProfitAccumulated;

          console.log(
            `[FIX] Machine ${machine._id} - Assigned ${daysSinceAssigned} days ago, reversing $${incorrectAmount}`
          );

          // Reset machine
          machine.monthlyProfitAccumulated = 0;
          machine.lastProfitUpdate = assignedDate;
          await machine.save({ session });

          // Deduct from balance
          const userBalance = await Balance.findOne({
            user: machine.user,
          }).session(session);

          if (userBalance) {
            const oldTotal = userBalance.totalBalance;
            userBalance.miningBalance = Math.max(
              0,
              userBalance.miningBalance - incorrectAmount
            );
            userBalance.totalBalance =
              userBalance.adminAdd + userBalance.miningBalance;
            await userBalance.save({ session });

            await Transaction.create(
              [
                {
                  user: machine.user,
                  amount: incorrectAmount,
                  type: 'profit',
                  status: 'completed',
                  balanceBefore: oldTotal,
                  balanceAfter: userBalance.totalBalance,
                  details: `[REVERSAL] Incorrect early profit payout for machine ${machine._id} — reversed`,
                  transactionDate: currentDate,
                  metadata: {
                    reversal: true,
                    userMachineId: machine._id,
                    reversedAmount: incorrectAmount,
                    reason: 'Cron paid before 30 days due to test config',
                  },
                },
              ],
              { session }
            );

            totalReversed += incorrectAmount;
            usersFixed++;

            console.log(
              `[FIX] ✅ Reversed $${incorrectAmount} from user ${machine.user}`
            );
          }
        }
      }
    });

    console.log(`\n[FIX] ===== COMPLETED =====`);
    console.log(`[FIX] Records fixed: ${usersFixed}`);
    console.log(`[FIX] Total amount reversed: $${totalReversed.toFixed(2)}`);
    console.log(`[FIX] Finished at ${new Date().toISOString()}\n`);

    return {
      success: true,
      usersFixed,
      totalReversed: Number(totalReversed.toFixed(2)),
    };
  } catch (error) {
    console.error('[FIX] ERROR:', error);
    throw error;
  } finally {
    session.endSession();
  }
};