"use client";

import { memo } from "react";
import { QRCodeSVG } from "qrcode.react";

/** QR code pointing at the join URL — scanning it drops a player straight
 * onto /multiplayer/join with the room code pre-filled. */
const RoomQrCode = memo(function RoomQrCode({ url, size = 168 }: { url: string; size?: number }) {
  return (
    <div className="inline-flex rounded-2xl bg-white p-3 shadow-[0_0_24px_rgba(232,193,95,0.25)]">
      <QRCodeSVG value={url} size={size} level="M" bgColor="#ffffff" fgColor="#0b1230" />
    </div>
  );
});

export default RoomQrCode;
