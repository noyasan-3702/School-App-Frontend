import {
  collection,
  DocumentData,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ReserveForm } from "./components/ReserveForm";
import db from "./firebase";
import styles from "./Reserve.module.css";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_API_BASE_URL || "http://localhost:3001";

export const Reserve = () => {
  // クエリストリングを受け取る
  const [searchParams] = useSearchParams();
  const [studentData, setStudentData] = useState<DocumentData>([]);
  const [scheduledDate, setScheduledDate] = useState<DocumentData>([]);
  const studentNo = searchParams.get("no");

  console.log("StDno", studentNo);

  useEffect(() => {
    const getAllData = async () => {
      try {
        // 生徒一覧の取得
        const studentListQuery = collection(db, "生徒一覧");
        const studentsSnapShot = await getDocs(studentListQuery);

        // 今日の日付の Timestamp を取得
        const now = Timestamp.now();

        // 実施予定日の取得（今日より未来の日付のみ、降順）
        const scheduledDateListQuery = query(
          collection(db, "実施予定日一覧"),
          where("scheduled_date", ">", now),
          orderBy("scheduled_date", "asc")
        );

        const scheduledDateListSnapShot = await getDocs(scheduledDateListQuery);

        console.log("Thus");

        // 生徒情報のフィルタリング
        const studentData = studentsSnapShot.docs
          .filter((doc) => doc.data()["No"] === Number(studentNo))
          .map((doc) => doc.data());

        console.log("SD", studentData);

        // 予定日情報の取得
        const scheduledDateData = scheduledDateListSnapShot.docs.map((doc) =>
          doc.data()
        );

        console.log("This");

        // 状態の更新
        setStudentData(studentData);
        setScheduledDate(scheduledDateData);
      } catch (error) {
        console.error("データ取得エラー:", error);
      }
    };

    // データの一括取得
    if (studentNo) {
      getAllData();
    }
  }, [studentNo]);

  const [joinDate, setJoinDate] = useState<string>("");

  // 変更なしで OK
  const handlePaymentClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!joinDate) {
      alert("参加日を選択してください！");
      return;
    }

    if (
      !studentData[0].No ||
      !studentData[0].Name ||
      !studentData[0].Grade ||
      !studentData[0].Kana
    ) {
      alert("該当の生徒が見つかりません。\n管理者までご連絡ください。");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentNo: studentData[0].No,
          studentName: studentData[0].Name,
          grade: studentData[0].Grade,
          kana: studentData[0].Kana,
          joinDate: joinDate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // ✅ Stripe Checkout 画面にリダイレクト
        window.location.href = data.url;
      } else {
        alert("決済の作成に失敗しました: " + data.error);
      }
    } catch (error) {
      console.error("決済エラー:", error);
      alert("決済エラーが発生しました");
    }
  };

  return (
    <div className={styles.reserve}>
      <h1>参加事前予約</h1>
      <ReserveForm
        studentData={studentData}
        scheduledDate={scheduledDate}
        setJoinDate={setJoinDate}
      />

      <button onClick={handlePaymentClick}>事前決済へ進む</button>
    </div>
  );
};
