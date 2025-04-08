import { QRCodeSVG } from "qrcode.react";
import styles from "./QRDisplay.module.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

function QRDisplay({
  QRInfo,
  onCloseQRDisplay,
}: {
  QRInfo: string;
  onCloseQRDisplay: () => void;
}) {
  const value = `${API_BASE_URL}/reserve?no=${QRInfo}`;

  return (
    <div className={styles.QRDisplay} onClick={onCloseQRDisplay}>
      <div className={styles.QRDisplay__displayArea}>
        <QRCodeSVG value={value} size={300} />
      </div>
    </div>
  );
}

export default QRDisplay;
