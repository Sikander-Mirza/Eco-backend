import cron from 'node-cron';
import UserMachine from './model/UserMAchine.js';
import SharePurchase from './model/SharePurchase.js';
import Balance from './model/Balance.js';
import Transaction from './model/withdrawals.js';
import mongoose from 'mongoose';

export const setupAutoProfitUpdates = () => {
  // ✅ Runs every day at 00:00 (midnight)
  // Checks all machines/shares and pays if >= 30 days since last payout
  cron.schedule('0 0 * * *', async () => {
    const now = new Date();
    console.log(`\n[CRON] ${now.toISOString()} - Starting profit update job`);

    const session = await mongoose.startSession();

    let normalProcessed = 0;
    let normalSkipped = 0;
    let sharesProcessed = 0;
    let sharesSkipped = 0;
    let totalPaidOut = 0;

    try {
      await session.withTransaction(async () => {

        // ============================================================
        // ================= NORMAL MACHINES ==========================
        // ============================================================
        console.log('\n[CRON] === Processing normal machines ===');
        
        const userMachines = await UserMachine.find({ status: 'active' })
          .populate('machine')
          .populate('user')
          .session(session);

        console.log(`[CRON] Found ${userMachines.length} active normal machines`);

        for (const machine of userMachines) {
          // Skip if data is broken
          if (!machine.user || !machine.user._id) {
            console.warn(`[CRON] ⚠️ Skip machine ${machine._id} - no user`);
            continue;
          }
          if (!machine.machine || !machine.machine.monthlyProfit) {
            console.warn(`[CRON] ⚠️ Skip machine ${machine._id} - no machine data`);
            continue;
          }

          const lastUpdate = machine.lastProfitUpdate || machine.assignedDate;
          const currentDate = new Date();

          // Days since last profit payout (or since machine was assigned)
          const daysSinceUpdate = Math.floor(
            (currentDate.getTime() - new Date(lastUpdate).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          // ✅ How many FULL months are due (supports backfill)
          const monthsDue = Math.floor(daysSinceUpdate / 30);

          if (monthsDue < 1) {
            normalSkipped++;
            console.log(
              `[CRON] ⏭️  Skip machine ${machine._id} - only ${daysSinceUpdate} day(s) since last update`
            );
            continue;
          }

          // ✅ Calculate total profit for all missed months
          const monthlyProfit = machine.machine.monthlyProfit;
          const profitToAdd = Number((monthlyProfit * monthsDue).toFixed(4));

          // ---------- UPDATE MACHINE ----------
          machine.monthlyProfitAccumulated += profitToAdd;
          // Move lastProfitUpdate forward by exactly (monthsDue × 30 days)
          machine.lastProfitUpdate = new Date(
            new Date(lastUpdate).getTime() + monthsDue * 30 * 24 * 60 * 60 * 1000
          );
          await machine.save({ session });

          // ---------- UPDATE USER BALANCE ----------
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
          }

          const oldTotal = userBalance.totalBalance || 0;

          userBalance.miningBalance = Number(
            (userBalance.miningBalance + profitToAdd).toFixed(4)
          );
          userBalance.totalBalance = Number(
            (userBalance.adminAdd + userBalance.miningBalance).toFixed(4)
          );
          userBalance.lastUpdated = currentDate;
          await userBalance.save({ session });

          // ---------- CREATE TRANSACTION RECORD ----------
          await Transaction.create(
            [
              {
                user: machine.user._id,
                amount: profitToAdd,
                type: 'profit',
                status: 'completed',
                balanceBefore: oldTotal,
                balanceAfter: userBalance.totalBalance,
                details:
                  monthsDue === 1
                    ? `Monthly profit from ${machine.machine.machineName}`
                    : `${monthsDue} months of profit from ${machine.machine.machineName} (auto-backfill)`,
                transactionDate: currentDate,
                metadata: {
                  userMachineId: machine._id,
                  machineId: machine.machine._id,
                  machineName: machine.machine.machineName,
                  monthlyProfit: monthlyProfit,
                  monthsPaid: monthsDue,
                  daysSinceLastUpdate: daysSinceUpdate,
                  isBackfill: monthsDue > 1,
                },
              },
            ],
            { session }
          );

          normalProcessed++;
          totalPaidOut += profitToAdd;

          const u = machine.user;
          const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();

          console.log(`[CRON] ✅ Normal machine profit paid:`, {
            user: fullName || u.email || u._id?.toString(),
            machine: machine.machine.machineName,
            daysSinceLast: daysSinceUpdate,
            monthsPaid: monthsDue,
            monthlyRate: `$${monthlyProfit}`,
            totalPaid: `$${profitToAdd}`,
            newBalance: `$${userBalance.totalBalance}`,
            backfill: monthsDue > 1 ? '⚠️ YES' : 'no',
          });
        }

        // ============================================================
        // ================= SHARE MACHINES ===========================
        // ============================================================
        console.log('\n[CRON] === Processing share machines ===');
        
        const activeShares = await SharePurchase.find({ status: 'active' })
          .populate('machine')
          .populate('user')
          .session(session);

        console.log(`[CRON] Found ${activeShares.length} active shares`);

        for (const share of activeShares) {
          // Skip if data is broken
          if (!share.user || !share.user._id) {
            console.warn(`[CRON] ⚠️ Skip share ${share._id} - no user`);
            continue;
          }
          if (!share.machine || !share.profitPerShare) {
            console.warn(`[CRON] ⚠️ Skip share ${share._id} - no machine/profit data`);
            continue;
          }

          const lastUpdate = share.lastProfitUpdate || share.purchaseDate;
          const currentDate = new Date();

          const daysSinceUpdate = Math.floor(
            (currentDate.getTime() - new Date(lastUpdate).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          const monthsDue = Math.floor(daysSinceUpdate / 30);

          if (monthsDue < 1) {
            sharesSkipped++;
            console.log(
              `[CRON] ⏭️  Skip share ${share._id} - only ${daysSinceUpdate} day(s) since last update`
            );
            continue;
          }

          // ✅ Calculate profit: profitPerShare × numberOfShares × monthsDue
          const monthlyProfit = Number(
            (share.profitPerShare * share.numberOfShares).toFixed(4)
          );
          const profitToAdd = Number(
            (monthlyProfit * monthsDue).toFixed(4)
          );

          // ---------- UPDATE SHARE ----------
          share.totalProfitEarned = Number(
            (share.totalProfitEarned + profitToAdd).toFixed(4)
          );
          share.lastProfitUpdate = new Date(
            new Date(lastUpdate).getTime() + monthsDue * 30 * 24 * 60 * 60 * 1000
          );
          await share.save({ session });

          // ---------- UPDATE USER BALANCE ----------
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
          }

          const oldTotal = userBalance.totalBalance || 0;

          userBalance.miningBalance = Number(
            (userBalance.miningBalance + profitToAdd).toFixed(4)
          );
          userBalance.totalBalance = Number(
            (userBalance.adminAdd + userBalance.miningBalance).toFixed(4)
          );
          userBalance.lastUpdated = currentDate;
          await userBalance.save({ session });

          // ---------- CREATE TRANSACTION RECORD ----------
          await Transaction.create(
            [
              {
                user: share.user._id,
                amount: profitToAdd,
                type: 'SHARE_PROFIT',
                status: 'completed',
                balanceBefore: oldTotal,
                balanceAfter: userBalance.totalBalance,
                details:
                  monthsDue === 1
                    ? `Monthly profit for ${share.numberOfShares} shares of ${share.machine.machineName}`
                    : `${monthsDue} months of profit for ${share.numberOfShares} shares of ${share.machine.machineName} (auto-backfill)`,
                transactionDate: currentDate,
                metadata: {
                  shareId: share._id,
                  machineId: share.machine._id,
                  machineName: share.machine.machineName,
                  numberOfShares: share.numberOfShares,
                  profitPerShare: share.profitPerShare,
                  monthlyProfit: monthlyProfit,
                  monthsPaid: monthsDue,
                  daysSinceLastUpdate: daysSinceUpdate,
                  isBackfill: monthsDue > 1,
                },
              },
            ],
            { session }
          );

          sharesProcessed++;
          totalPaidOut += profitToAdd;

          const u = share.user;
          const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();

          console.log(`[CRON] ✅ Share profit paid:`, {
            user: fullName || u.email || u._id?.toString(),
            machine: share.machine.machineName,
            shares: share.numberOfShares,
            daysSinceLast: daysSinceUpdate,
            monthsPaid: monthsDue,
            monthlyRate: `$${monthlyProfit}`,
            totalPaid: `$${profitToAdd}`,
            totalEarned: `$${share.totalProfitEarned}`,
            newBalance: `$${userBalance.totalBalance}`,
            backfill: monthsDue > 1 ? '⚠️ YES' : 'no',
          });
        }
      });

      // ============ SUMMARY LOG ============
      console.log(`\n[CRON] ====== SUMMARY ======`);
      console.log(`[CRON] Normal Machines: ${normalProcessed} paid, ${normalSkipped} skipped`);
      console.log(`[CRON] Share Machines:  ${sharesProcessed} paid, ${sharesSkipped} skipped`);
      console.log(`[CRON] Total Paid Out:  $${totalPaidOut.toFixed(2)}`);
      console.log(`[CRON] Finished at:     ${new Date().toISOString()}\n`);

    } catch (error) {
      console.error('[CRON] ❌ Profit update failed:', error);
      console.error('[CRON] Stack:', error.stack);
    } finally {
      session.endSession();
    }
  });

  console.log('✅ [CRON] Profit update job scheduled - runs daily at 00:00');
};