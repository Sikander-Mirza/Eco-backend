// backend/utils/ethValidation.ts
import { ethers } from "ethers";
import TronWeb from "tronweb";

const tronWeb = new TronWeb({
  fullHost: "https://api.trongrid.io", // mainnet
});
const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
// e.g. https://mainnet.infura.io/v3/YOUR_KEY


export async function checkTronAddress(address) {
  const result = {
    valid: false,
    active: false,
    balance: 0,
  };

  if (!tronWeb.isAddress(address)) return result;

  result.valid = true;

  const account = await tronWeb.trx.getAccount(address); // empty for unused
  const balance = account?.balance || 0;
  const hasAssets =
    Array.isArray(account?.assetV2) && account.assetV2.length > 0;

  result.balance = balance;
  result.active = balance > 0 || hasAssets;

  return result;
}

export async function checkEthAddress(address) {
  const result = {
    valid: false,
    active: false,
    balance: "0",
    txCount: 0,
  };

  if (!ethers.isAddress(address)) return result;

  result.valid = true;

  const [balance, txCount] = await Promise.all([
    provider.getBalance(address),
    provider.getTransactionCount(address),
  ]);

  result.balance = balance.toString();
  result.txCount = txCount;
  result.active = balance > 0n || txCount > 0; // uses BigInt, fine in JS

  return result;
}