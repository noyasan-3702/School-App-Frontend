import { useEffect, useState } from "react";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { useLocation } from 'react-router-dom';
import db from "./firebase";
import './App.css'

function AttendanceList() {

  const [ count, setCount ] = useState(0);     // 出席者の合計人数を管理するステート
  const [ Attendances, setAttendances ] = useState<any>([])
  const [ sortConfig, setSortConfig ] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const location = useLocation();
  const { Searchdate } = location.state;

  // 初回読み込み
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 出席状況データベースにアクセス
        const AttendanceData = collection(db, "出席状況")

        // `Searchdate` を `Date` 型に変換（重要）
        const day = new Date(Searchdate);
        day.setHours(0, 0, 0, 0); // 当日 00:00:00 にリセット

        // Firestore で検索するための `Timestamp` を作成
        const startTimestamp = Timestamp.fromDate(day);

        // 当日 23:59:59 に設定
        const endDate = new Date(day);
        endDate.setHours(23, 59, 59, 999);
        const endTimestamp = Timestamp.fromDate(endDate);

        // デバック用のログ
        console.log(`指定の最初の日付: ${startTimestamp}`);
        console.log(`指定の最後の日付: ${startTimestamp}`);

        // 条件を設定
        const q = query(
          AttendanceData,
          where("Participation", ">=", startTimestamp),
          where("Participation", "<", endTimestamp)
        );

        // Firestore からデータを取得
        const querySnapshot = await getDocs(q);
        const attendees = querySnapshot.docs.map((doc) => doc.data());

        // 結果を配列に追加
        setAttendances(attendees);
        setCount(querySnapshot.size);
        console.log(`本日の出席者数: ${querySnapshot.size} 人`);

      } catch (error) {
        console.error("データの取得に失敗しました", error);
      }
    };

    // 関数の実行
    fetchData();
  }, [Searchdate]);

  // 指定の日付を取得
  const day = Searchdate;
  const formatDate = new Date(day).toLocaleDateString('ja-JP', { 
      year: 'numeric',    // 年 (例: 2024)
      month: '2-digit',   // 月 (例: 01)
      day: '2-digit'      // 日 (例: 01)
  });
  console.log(`指定の日付: ${formatDate}`);


    /**テーブル内の各項目ごとのソート処理
   * テーブル内の逆三角のアイコンにソート機能を追加します。
   * 
   * アイコンをクリックするごとに「昇順」→「降順」→「昇順」と切り替えを行います。
   */
  // ソートボタン処理
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {

        // 「昇順」と「降順」を切り替え
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" }; 
      }
      return { key, direction: "asc" }; // 新しいキーで昇順ソート
    });
  };

  // 並び替え処理
  const sortTable = [...Attendances].sort((a, b) => {
    if (!sortConfig) return 0;  // ソートできる対象項目かを判別する

    const { key, direction } = sortConfig;  // key と direction を 分割代入
    const valueA = a[key];
    const valueB = b[key];

    // ソートする項目が数値だった時
    if (typeof valueA === "number" && typeof valueB === "number") {
      // 数値の大小を比較して並び替える
      return direction === "asc" ? valueA - valueB : valueB - valueA;
    }
    // ソートする項目が文字列だった時
    if (typeof valueA === "string" && typeof valueB === "string") {
      // 文字列を比較して並び変える
      return direction === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    }
    return 0;
  });

  return (
    <>
      <div className="Attendance-List">
        <div className="Title-area">
          <h1>出席データ詳細</h1>
        </div>
        <div className="overview">
          <div className="List-area">
            <div className="SubTitle-area">
              <h2>概要</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="table-link-box">
                      <label className="table-link-text">
                        日付
                      </label>
                    </div>
                  </th>
                  <th>
                    <div className="table-link-box">
                      <label className="table-link-text">
                        出席人数
                      </label>
                    </div>
                  </th>
                  <th>
                    <div className="table-link-box">
                      <label className="table-link-text">
                        合計金額
                      </label>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{formatDate}</td>     {/* 関数から当日の日付を取得 */}
                  <td>{count}</td>          {/* データベースから出席人数を取得 */}
                  <td>{count * 1000}</td>   {/* データベースから合計金額を取得 */}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="Attendee-list">
          <div className="List-area">
            <div className="SubTitle-area">
              <h2>出席者一覧</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="table-label" onClick={() => handleSort("Name")}>
                      <div className="table-sort-label">
                        <label className="table-sort-icon">
                          {sortConfig?.key === "Name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "▼"}
                        </label>
                        <label className="table-sort-text">
                          氏名
                        </label>
                      </div>
                    </div>
                  </th>
                  <th>
                    <div className="table-label" onClick={() => handleSort("Kana")}>
                      <div className="table-sort-label">
                        <label className="table-sort-icon">
                          {sortConfig?.key === "Kana" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "▼"}
                        </label>
                        <label className="table-sort-text">
                          フリガナ
                        </label>
                      </div>
                    </div>
                  </th>
                  <th>
                    <div className="table-label" onClick={() => handleSort("Grade")}>
                      <div className="table-sort-label">
                        <label className="table-sort-icon">
                          {sortConfig?.key === "Grade" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "▼"}
                        </label>
                        <label className="table-sort-text">
                          学年
                        </label>
                      </div>
                    </div>
                  </th>
                  <th>
                    <div className="table-label" onClick={() => handleSort("Team")}>
                      <div className="table-sort-label">
                        <label className="table-sort-icon">
                          {sortConfig?.key === "Team" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "▼"}
                        </label>
                        <label className="table-sort-text">
                          所属チーム
                        </label>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(sortTable).map((Attendance: any) => (
                  <tr>
                    <td>{Attendance.Name}</td>   {/* データベースから氏名を取得 */}
                    <td>{Attendance.Kana}</td>   {/* データベースからフリガナを取得 */}
                    <td>{Attendance.Grade}</td>  {/* データベースから学年を取得 */}
                    <td>{Attendance.Team}</td>   {/* データベースからチーム名を取得 */}
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

export default AttendanceList;