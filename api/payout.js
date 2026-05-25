/* eslint-disable */
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  getAccount,
} from "@solana/spl-token";
import bs58 from "bs58";

const RPC_URL =
  "https://mainnet.helius-rpc.com/?api-key=45c09379-40fc-49f0-93a0-733d9d41d1a4";
const TOKEN_MINT = new PublicKey(
  "DGNPSiTrX5xnKcpVKBaXUsWBZbFuA2cJcb7fUJmoAJrd"
);
const DECIMALS = 6;
const FB_URL =
  "https://project-freedom-a004e-default-rtdb.firebaseio.com";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "Missing roomId" });

  try {
    // 1. Ucitaj game iz Firebase
    const fbResp = await fetch(`${FB_URL}/games/${roomId}.json`);
    const game = await fbResp.json();
    if (!game) return res.status(404).json({ error: "Game not found" });

    const { winner, wager, p1wallet, p2wallet } = game;
    if (!winner)
      return res.status(400).json({ error: "Game not finished yet" });

    // 2. Ucitaj escrow keypair
    const connection = new Connection(RPC_URL, "confirmed");
    const escrowSecret = bs58.decode(process.env.ESCROW_PRIVATE_KEY);
    const escrowKeypair = Keypair.fromSecretKey(escrowSecret);

    const escrowATA = await getOrCreateAssociatedTokenAccount(
      connection,
      escrowKeypair,
      TOKEN_MINT,
      escrowKeypair.publicKey
    );

    const totalPot = wager * 2;

    // 3. DRAW — vrati wager oboma igracima
    if (winner === "draw") {
      const refundRaw = BigInt(wager) * BigInt(10 ** DECIMALS);
      const results = [];

      for (const [role, walletAddr] of [
        ["p1", p1wallet],
        ["p2", p2wallet],
      ]) {
        if (!walletAddr) continue;
        const playerPubkey = new PublicKey(walletAddr);
        const playerATA = await getOrCreateAssociatedTokenAccount(
          connection,
          escrowKeypair,
          TOKEN_MINT,
          playerPubkey
        );
        const sig = await transfer(
          connection,
          escrowKeypair,
          escrowATA.address,
          playerATA.address,
          escrowKeypair,
          refundRaw
        );
        results.push({ role, wallet: walletAddr, amount: wager, sig });
        console.log(
          `[PAYOUT DRAW] Room:${roomId} | ${role} refund:${wager} | TX:${sig}`
        );
      }

      return res.status(200).json({
        ok: true,
        type: "draw",
        totalPot,
        results,
        message: `Draw: ${wager} FREEDOM vraceno svakom igracu.`,
      });
    }

    // 4. WIN — 95% winneru, 5% ostaje u escrow za burn
    const winnerWallet = winner === "p1" ? p1wallet : p2wallet;
    if (!winnerWallet)
      return res.status(400).json({ error: "Winner wallet not found" });

    const winnerAmount = Math.floor(totalPot * 0.95); // 95%
    const burnAmount = totalPot - winnerAmount;        // 5% ostaje u escrow
    const winnerAmountRaw =
      BigInt(winnerAmount) * BigInt(10 ** DECIMALS);

    // Provjeri da escrow ima dovoljno
    const escrowBalance = await getAccount(connection, escrowATA.address);
    if (escrowBalance.amount < winnerAmountRaw) {
      return res.status(500).json({
        error: "Insufficient escrow balance",
        escrow: escrowBalance.amount.toString(),
        required: winnerAmountRaw.toString(),
      });
    }

    const winnerPubkey = new PublicKey(winnerWallet);
    const winnerATA = await getOrCreateAssociatedTokenAccount(
      connection,
      escrowKeypair,
      TOKEN_MINT,
      winnerPubkey
    );

    const txSignature = await transfer(
      connection,
      escrowKeypair,
      escrowATA.address,
      winnerATA.address,
      escrowKeypair,
      winnerAmountRaw
    );

    console.log(
      `[PAYOUT WIN] Room:${roomId} | Pot:${totalPot} | ` +
        `Winner(${winner}):${winnerAmount} (95%) | Burn:${burnAmount} (5%) | TX:${txSignature}`
    );

    return res.status(200).json({
      ok: true,
      type: "win",
      winner,
      winnerWallet,
      totalPot,
      winnerAmount,
      burnAmount,
      txSignature,
      message: `${winnerAmount} FREEDOM poslato winneru. ${burnAmount} FREEDOM ostaje u escrow za burn.`,
    });
  } catch (err) {
    console.error("[PAYOUT ERROR]", err);
    return res.status(500).json({ error: err.message || "Payout failed" });
  }
}
