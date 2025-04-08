import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import db from "./firebase";

interface Dashboard {
  id: string;
  No: number;
  Name: string;
  Kana: string;
  Grade: number;
  Team: string;
  Participation: Timestamp;
}

type DataType = {
  date: string;
  people: number;
  amount: number;
  attendees: any[];
};

type SortConfigType = {
  key: keyof DataType; // DataTypeのキーを指定
  direction: "asc" | "desc";
};

function Dashboard() {
  const [count, setCount] = useState(0); // 出席者の合計人数を管理するステート
  const [pastData, setPastData] = useState<{ date: string; people: number; amount: number; attendees: any[] }[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: any;
    direction: "asc" | "desc";
  } | null>(null);

  // Firestore からデータを取得する
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Firestore の "出席状況" コレクションを参照して当日以降のデータを取得
        const attendanceRef = collection(db, "出席状況");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp: Timestamp = Timestamp.fromDate(today);

        // クエリを作成（"Participation" フィールドが指定した日付のデータを取得）
        const q = query(attendanceRef, where("Participation", ">=", todayTimestamp));

        // Firestore からデータを取得
        const querySnapshot = await getDocs(q);

        // 取得したデータの数をカウント
        setCount(querySnapshot.size);
        console.log(`本日の出席者数: ${querySnapshot.size} 人`);

        // Firestore の "出席状況" コレクションを参照して今月の練習日のデータを全て取得
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const practiceDates = getThursdaysAndSaturdays(year, month);
        const pastDataArray = [];

        for (const date of practiceDates) {
          // Firestore から該当日の出席者を取得
          const startTimestamp = date instanceof Timestamp ? date : Timestamp.fromDate(date);
          const startDate = startTimestamp.toDate(); // Timestamp → Date に変換
          startDate.setHours(23, 59, 59, 999); // 時間を 23:59:59 に設定
          const endTimestamp = Timestamp.fromDate(startDate);

          const q = query(
            attendanceRef,
            where("Participation", ">=", startTimestamp),
            where("Participation", "<", endTimestamp)
          );

          const QuerySnapshot = await getDocs(q);
          const attendees = QuerySnapshot.docs.map((doc) => doc.data());

          // 結果を配列に追加
          pastDataArray.push({
            date: startTimestamp.toDate().toLocaleDateString(), // YYYY/MM/DD 形式
            people: attendees.length,
            amount: attendees.length * 1000,
            attendees: attendees,
          });
        }

        setPastData(pastDataArray);
      } catch (error) {
        console.error("データの取得に失敗しました", error);
      }
    };

    // 関数の実行
    fetchData();
  }, []);

  // 今月の過去の木曜・土曜の出席者数を取得
  const getThursdaysAndSaturdays = (year: number, month: number) => {
    const dates: Timestamp[] = [];
    const lastDay = today.getDate(); // 今の日付を最終日とする

    for (let day = 1; day <= lastDay; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 4 || dayOfWeek === 6) {
        date.setHours(0, 0, 0, 0);
        dates.push(Timestamp.fromDate(date));
      }
    }
    return dates;
  };

  // 当日の日付を取得
  const today = new Date();
  const formatDate = today.toLocaleDateString("ja-JP", {
    year: "numeric", // 年 (例: 2024)
    month: "2-digit", // 月 (例: 01)
    day: "2-digit", // 日 (例: 01)
  });

  // 詳細ページ遷移処理
  const navigate = useNavigate();

  // 遷移先に表示させる日付を渡す
  const AttendanceListGo = (date: string) => {
    navigate("/AttendanceList", { state: { Searchdate: date } });
  };

  /**テーブル内の各項目ごとのソート処理
   * テーブル内の逆三角のアイコンにソート機能を追加します。
   *
   * アイコンをクリックするごとに「昇順」→「降順」→「昇順」と切り替えを行います。
   */
  // ソート処理（useMemo で最適化）
  const sortedTableData = !sortConfig
    ? pastData // ソート設定がない場合はそのまま返す（ソートは行わない）
    : [...pastData].sort((a, b) => {
        const { key, direction } = sortConfig as SortConfigType;
        const valueA = a[key];
        const valueB = b[key];

        // 日付の場合（date は文字列なので Date に変換）
        if (key === "date") {
          const dateA = typeof valueA === "string" || typeof valueA === "number" ? new Date(valueA).getTime() : NaN;
          const dateB = typeof valueB === "string" || typeof valueB === "number" ? new Date(valueB).getTime() : NaN;

          return direction === "asc" ? dateA - dateB : dateB - dateA;
        }

        // 数値の場合（出席人数・合計金額）
        if (typeof valueA === "number" && typeof valueB === "number") {
          return direction === "asc" ? valueA - valueB : valueB - valueA;
        }

        // 文字列の場合
        if (typeof valueA === "string" && typeof valueB === "string") {
          return direction === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }
        return 0; // それ以外は変更なし
      });

  // ソート処理（クリック時）
  const handleSort = (key: "date" | "attendees" | "totalAmount") => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" }; // 昇順・降順を切り替え
      }
      return { key, direction: "asc" }; // 初回クリック時は昇順
    });
  };

  return (
    <>
      <div className="Dashboard-List">
        <div className="Title-area">
          <h1>ダッシュボード</h1>
        </div>
        <div className="TodayData-area">
          <div className="List-area">
            <div className="SubTitle-area">
              <h2>当日データ</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="table-link-box">
                      <label className="table-link-text">日付</label>
                    </div>
                  </th>
                  <th>
                    <div className="table-link-box">
                      <label className="table-link-text">出席人数</label>
                    </div>
                  </th>
                  <th>
                    <div className="table-link-box">
                      <label className="table-link-text">合計金額</label>
                    </div>
                  </th>
                  <th>
                    <div className="table-link-box">
                      <label className="table-link-text">詳細</label>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{formatDate}</td>
                  {/* 関数から当日の日付を取得 */}
                  <td>{count}</td>
                  {/* データベースから出席人数を取得 */}
                  <td>{count * 1000}</td>
                  {/* データベースから合計金額を取得 */}
                  <td>
                    <button className="detailbtn" onClick={() => AttendanceListGo(formatDate)}>
                      データ詳細
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="PastData-area">
          <div className="List-area">
            <div className="SubTitle-area">
              <h2>過去データ</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="table-sort-label" onClick={() => handleSort("date")}>
                      <span className="table-sort-icon">
                        {sortConfig?.key === "date" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "▼"}
                      </span>
                      <span className="table-sort-text">日付</span>
                    </div>
                  </th>
                  <th>
                    <div className="table-sort-label" onClick={() => handleSort("attendees")}>
                      <span className="table-sort-icon">
                        {sortConfig?.key === "attendees" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "▼"}
                      </span>
                      <span className="table-sort-text">出席人数</span>
                    </div>
                  </th>
                  <th>
                    <div className="table-sort-label" onClick={() => handleSort("totalAmount")}>
                      <span className="table-sort-icon">
                        {sortConfig?.key === "totalAmount" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "▼"}
                      </span>
                      <span className="table-sort-text">合計金額</span>
                    </div>
                  </th>
                  <th>
                    <div className="table-link-box">
                      <label className="table-link-text">詳細</label>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTableData.map((pastData: any) => (
                  <tr>
                    <td>{pastData.date}</td>
                    {/* データベースから過去の日付を取得 */}
                    <td>{pastData.people}</td>
                    {/* データベースから過去の出席人数を取得 */}
                    <td>{pastData.amount}</td>
                    {/* データベースから過去の合計金額を取得 */}
                    <td>
                      <button className="detailbtn" onClick={() => AttendanceListGo(pastData.date)}>
                        データ詳細
                      </button>
                    </td>
                    {/* データベースから過去の出席情報を取得 */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
