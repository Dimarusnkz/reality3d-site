"use client";

export function PayTbankLinkButton() {
  const url = process.env.NEXT_PUBLIC_TBANK_SELFEMPLOYED_PAYMENT_URL || "https://www.tinkoff.ru/rm/r_JESjEcBisx.CSUFIGiBXm/5zoeh15252";
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-10 w-full sm:w-auto items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(255,94,0,0.3)] hover:bg-primary/90 transition-all"
    >
      Оплатить (Т‑Банк)
    </a>
  );
}

