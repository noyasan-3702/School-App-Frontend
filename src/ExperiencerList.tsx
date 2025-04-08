import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import db from "./firebase";
import './App.css'

function ExperiencerList() {
  const [ experiencers, setExperiencers ] = useState<any>([])
  const [ sortConfig, setSortConfig ] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // 初回読み込み
  useEffect(() => {
    // 体験者情報データベースにアクセス
    const experiencersData = collection(db, "体験者情報")

    // データを取得できたら、配列内にデータを格納
    getDocs(experiencersData).then((snapShot) => {
      console.log(snapShot.docs.map((doc) => ({ ...doc.data() })))
      setExperiencers(snapShot.docs.map((doc) => ({ ...doc.data() })));
    });
  }, []);



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
  const sortTable = [...experiencers].sort((a, b) => {
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
        <div className="ExperiencerList">
          <div className="Title-area">
            <h1>体験者リスト</h1>
          </div>
          <div className="List-area">
            <table>
              <thead>
                <tr>
                  <th>
                    <div className="table-label" onClick={() => handleSort("Experience")}>
                      <div className="table-sort-label">
                        <label className="table-sort-icon">
                          {sortConfig?.key === "Experience" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "▼"}
                        </label>
                        <label className="table-sort-text">
                          体験日
                        </label>
                      </div>
                    </div>
                  </th>
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
                {sortTable.map((experiencer:any) => (
                  <tr>
                    <td>{experiencer.Experience}</td>{/* データベースから体験日を取得 */}
                    <td>{experiencer.Name}</td>{/* データベースから氏名を取得 */}
                    <td>{experiencer.Kana}</td>{/* データベースからフリガナを取得 */}
                    <td>{experiencer.Grade}</td>{/* データベースから学年を取得 */}
                    <td>{experiencer.Team}</td>{/* データベースからチーム名を取得 */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }
  
  export default ExperiencerList;