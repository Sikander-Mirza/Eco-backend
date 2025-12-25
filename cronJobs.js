import cron from 'node-cron';
import UserMachine from './model/UserMAchine.js';
import SharePurchase from './model/SharePurchase.js';
import Balance from './model/Balance.js';
import Transaction from './model/withdrawals.js';
import mongoose from 'mongoose';

export const setupAutoProfitUpdates = () => {
  // DEV / TEST: run every 5 minutes
  // PROD: change this to '0 0 * * *'
  cron.schedule('0 0 * * *', async () => {
    const now = new Date();
    console.log(`[CRON] ${now.toISOString()} - Starting automated profit update`);

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // ================= NORMAL MACHINES =================
        console.log('[CRON] Processing normal machines...');
        const userMachines = await UserMachine.find({ status: 'active' })
          .populate('machine')
          .populate('user')
          .session(session);

        for (const machine of userMachines) {
          // Guard: machine must have user
          if (!machine.user || !machine.user._id) {
            console.warn(
              `[CRON] Skipping normal machine ${machine._id} because it has no user associated`
            );
            continue;
          }

          const lastUpdate = machine.lastProfitUpdate || machine.assignedDate;
          const currentDate = new Date();

          // Minutes since last update (for testing)
          const daysSinceUpdate = Math.floor(
            (currentDate.getTime() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24)
          );

          // Only update if >= 5 minutes
          if (daysSinceUpdate >= 30) {
            const profitToAdd = machine.machine.monthlyProfit;

            // Update machine record
            machine.monthlyProfitAccumulated += profitToAdd;
            machine.lastProfitUpdate = currentDate;
            await machine.save({ session });

            // Find or create user balance
            let userBalance = await Balance.findOne({
              user: machine.user._id,
            }).session(session);

            if (!userBalance) {
              userBalance = new Balance({
                user: machine.user._id,
                miningBalance: 0,
                adminAdd: 0,
                totalBalance: 0,
              });
            } else if (!userBalance.user) {
              // Fix legacy balance docs missing user
              userBalance.user = machine.user._id;
            }

            // ---- oldTotal MUST be defined here ----
            const oldTotal = userBalance.totalBalance || 0;

            // Update balance
            userBalance.miningBalance += profitToAdd;
            userBalance.totalBalance =
              userBalance.adminAdd + userBalance.miningBalance;
            userBalance.lastUpdated = currentDate;
            await userBalance.save({ session });

            // Create transaction
            await Transaction.create(
              [
                {
                  user: machine.user._id,
                  amount: profitToAdd,
                  type: 'profit', // or 'MINING_PROFIT' if you added it to enum
                  status: 'completed',
                  balanceBefore: oldTotal,
                  balanceAfter: userBalance.totalBalance,
                  details: `Monthly profit for machine ${machine._id} (after ${minutesSinceUpdate} minutes)`,
                  transactionDate: currentDate,
                  metadata: {
                    userMachineId: machine._id,
                    machineId: machine.machine._id,
                    machineName: machine.machine.machineName,
                    minutesSinceLastUpdate: minutesSinceUpdate,
                  },
                },
              ],
              { session }
            );

            const u = machine.user || {};
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();

            console.log('[CRON] Normal machine profit:', {
              userId: u._id?.toString(),
              userName: fullName || 'N/A',
              userEmail: u.email || 'N/A',
              userMachineId: machine._id.toString(),
              minutesProcessed: minutesSinceUpdate,
              profitAdded: profitToAdd,
              machineAccumulated: machine.monthlyProfitAccumulated,
              balanceBefore: oldTotal,
              balanceAfter: userBalance.totalBalance,
            });
          } else {
            console.log(
              `[CRON] Normal machine ${machine._id} (user: ${machine.user?._id
              }) skipped - only ${minutesSinceUpdate} minutes since last update`
            );
          }
        }

        // ================= SHARED MACHINES =================
        console.log('[CRON] Processing share machines...');
        const activeShares = await SharePurchase.find({ status: 'active' })
          .populate('machine')
          .populate('user')
          .session(session);

        for (const share of activeShares) {
          if (!share.user || !share.user._id) {
            console.warn(
              `[CRON] Skipping share ${share._id} because it has no user associated`
            );
            continue;
          }

          const lastUpdate = share.lastProfitUpdate || share.purchaseDate;
          const currentDate = new Date();

          const minutesSinceUpdate = Math.floor(
            (currentDate.getTime() - new Date(lastUpdate).getTime()) / (1000 * 60)
          );

          if (minutesSinceUpdate >= 5) {
            const profitToAdd = Number(
              (share.profitPerShare * share.numberOfShares).toFixed(4)
            );

            let userBalance = await Balance.findOne({
              user: share.user._id,
            }).session(session);

            if (!userBalance) {
              userBalance = new Balance({
                user: share.user._id,
                miningBalance: 0,
                adminAdd: 0,
                totalBalance: 0,
              });
            } else if (!userBalance.user) {
              userBalance.user = share.user._id;
            }

            // ---- oldTotal defined here for shares ----
            const oldTotal = userBalance.totalBalance || 0;

            userBalance.miningBalance += profitToAdd;
            userBalance.totalBalance =
              userBalance.adminAdd + userBalance.miningBalance;
            userBalance.lastUpdated = currentDate;
            await userBalance.save({ session });

            share.totalProfitEarned += profitToAdd;
            share.lastProfitUpdate = currentDate;
            await share.save({ session });

            await Transaction.create(
              [
                {
                  user: share.user._id,
                  amount: profitToAdd,
                  type: 'SHARE_PROFIT',
                  status: 'completed',
                  balanceBefore: oldTotal,
                  balanceAfter: userBalance.totalBalance,
                  details: `Monthly profit for ${share.numberOfShares} shares (after ${minutesSinceUpdate} minutes)`,
                  transactionDate: currentDate,
                  metadata: {
                    shareId: share._id,
                    machineId: share.machine._id,
                    machineName: share.machine.machineName,
                    numberOfShares: share.numberOfShares,
                    profitPerShare: share.profitPerShare,
                    minutesSinceLastUpdate: minutesSinceUpdate,
                  },
                },
              ],
              { session }
            );

            const u = share.user || {};
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();

            console.log('[CRON] Share profit:', {
              userId: u._id?.toString(),
              userName: fullName || 'N/A',
              userEmail: u.email || 'N/A',
              shareId: share._id.toString(),
              minutesProcessed: minutesSinceUpdate,
              profitAdded: profitToAdd,
              totalShareProfit: share.totalProfitEarned,
              balanceBefore: oldTotal,
              balanceAfter: userBalance.totalBalance,
            });
          } else {
            console.log(
              `[CRON] Share ${share._id} (user: ${share.user?._id
              }) skipped - only ${minutesSinceUpdate} minutes since last update`
            );
          }
        }
      });

      console.log(
        `[CRON] ${new Date().toISOString()} - Profit update completed successfully`
      );
    } catch (error) {
      console.error('[CRON] Monthly profit update error:', error);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  });
};