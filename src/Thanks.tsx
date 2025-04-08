import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./Thanks.module.css";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_API_BASE_URL || "http://localhost:3001";

export const Thanks = () => {
  // クエリパラメータから情報を取得
  const [searchParams] = useSearchParams();
  const studentNo = searchParams.get("no");
  const kana = searchParams.get("kana");
  const grade = searchParams.get("grade");
  const studentName = searchParams.get("name");
  const joinDate = searchParams.get("joinDate");

  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const pushData = async () => {
      try {
        // `/api/thanks` への POST リクエスト
        const response = await fetch(`${API_BASE_URL}/api/thanks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentNo,
            kana,
            grade,
            studentName,
            joinDate,
          }),
        });

        if (response.ok) {
          console.log("データ追加成功");
          setIsSuccess(true);
        } else {
          console.error("データ追加エラー");
          setIsSuccess(false);
        }
      } catch (error) {
        console.error("データ送信中にエラーが発生しました:", error);
        setIsSuccess(false);
      }
    };

    pushData();
  }, [studentNo, kana, grade, studentName, joinDate]);

  return (
    <div>
      <h1>予約完了</h1>
      {isSuccess ? (
        <>
          <p>参加生徒: {studentName} さん</p>
          <p>参加予定日: {joinDate}</p>

          <div className={styles.thanks}>
            <p>当日のご参加をお待ちしております。</p>
            <p>キャンセルの場合は、以下までご連絡ください。</p>
          </div>

          <p>
            <a href="">090-xxxx-xxxx</a>
          </p>
        </>
      ) : (
        <p>データ送信中にエラーが発生しました。管理者へご連絡ください。</p>
      )}
    </div>
  );
};
