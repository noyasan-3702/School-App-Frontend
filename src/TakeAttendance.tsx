import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, query, where, Timestamp } from "firebase/firestore";
import db from "./firebase";
import './App.css'

interface Student {
  id: string;
  No: number;
  Name: string;
  Kana: string;
  Grade: number;
  Team: string;
  Phone: string;
  Mail: string;
}

interface Attendees {
  id: string;
  No: number;
  Name: string;
  Kana: string;
  Grade: number;
  Team: string;
}

function TakeAttendance() {
  
  const [ students, setStudents ] = useState<any>([]);                                // データベースから取得した全ての生徒の情報を管理
  const [ attendees, setAttendees ] = useState<any>([]);                              // 出席状態の生徒の情報を管理
  const [ selectedTeam, setSelectedTeam ] = useState<string | null>(null);            // 選択されたチームを管理する
  const [ filteredStudents, setFilteredStudents ] = useState<any[]>([]);              // 表示する生徒リストを管理する
  const [ teamCounts, setTeamCounts ] = useState<{ [team: string]: number }>({});     // チーム内の合計人数を管理する
  const [ isPresent, setIsPresent ] = useState<{ [key: number]: boolean | null }>({});// 🔥 `No` をキーにする
  const [ sortConfig, setSortConfig ] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  
  
  /** 初回レンタリングの処理
   * 初回レンタリングの処理の処理となります。
   * 
   * 生徒一覧データベースから全ての生徒の情報を取得します。
   * 
   * また、チーム名を重複を削除して取り出し、
   * 編集ポップアップや新規追加ポップアップで使用可能な
   * ドロップダウンリストのデータを取得しています。
   * 
   * また、
  */
  useEffect(() => {
    fetchData();  // 関数を実行
    console.log("実行しました")
  }, []);

  const fetchData = async () => {
    try {
      // Firestore から "生徒一覧" コレクションのデータを取得
      const studentCollection = collection(db, "生徒一覧");
      const studentSnapshot = await getDocs(studentCollection);

      // Firestore のデータを取得し、id を含めたオブジェクトを作成
      const studentList: Student[] = studentSnapshot.docs.map(doc => {
        const data = doc.data() as Omit<Student, "id">; // Student 型から id を除いた型にする
        return { id: doc.id, ...data };                 // ドキュメントID を含めた Firestore に保存されている生徒データ
      });

      // 取得したデータを state にセット
      setStudents(studentList);

      // Firestore から "出席状況" コレクションのデータを取得
      const attendeesCollection = collection(db, "出席状況");
      const attendeesSnapshot = await getDocs(attendeesCollection);

      // Firestore のデータを取得し、id を含めたオブジェクトを作成
      const attendeesList: Attendees[] = attendeesSnapshot.docs.map(doc => {
        const data = doc.data() as Omit<Attendees, "id">; // attendees 型から id を除いた型にする
        return { id: doc.id, ...data };                   // ドキュメントID を含めた Firestore に保存されている生徒データ
      });

      // 取得したデータを state にセット
      setAttendees(attendeesList);

      // チームごとの人数を集計して、集計結果を state にセット 
      const teamCountMap = new Map<string, number>();
      studentList.forEach((studentList: { Team: string; }) => {
        if (studentList.Team) {
          teamCountMap.set(studentList.Team, (teamCountMap.get(studentList.Team) || 0) + 1);
        }
      });
      setTeamCounts(Object.fromEntries(teamCountMap));

      // Firestore から出席状況をチェックし、`isPresent` を更新
      const attendanceRef = collection(db, "出席状況");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp: Timestamp = Timestamp.fromDate(today);

      const updatedPresence: { [key: number]: boolean | null } = {};
      for (const student of studentList) {
        const q = query(
          attendanceRef,
          where("No", "==", student.No),
          where("Participation", ">=", todayTimestamp)
        );
        const querySnapshot = await getDocs(q);
        updatedPresence[student.No] = !querySnapshot.empty;
      }
      
      setIsPresent(updatedPresence);

      // デバッグ用のログ出力
      console.log("ボタンクリックした生徒の出席状況:", isPresent);

    } catch (error) {
      console.error("データの取得中にエラーが発生しました:", error);
    }
  };


  /** ボタンクリックの処理
   * 
   */
  const handleClick = async (student: Student) => {
    if (isPresent[student.No]) {
      await Deletestudent(student.No);
      setIsPresent((prev) => ({ ...prev, [student.No]: false }));
    } else {
      await Addstudent(student);
      setIsPresent((prev) => ({ ...prev, [student.No]: true }));
    }

    // Firestore の最新データを取得（再レンダリング用）
    fetchData(); 
    console.log("実行しました")
  };

  /** 出席者リストDBから特定の条件の生徒の情報を削除する処理
   * 
   */
  const Deletestudent = async (studentNo: number) => {
    try {
      // 出席状況DBのコレクションにアクセスする
      const attendanceRef = collection(db, "出席状況");

      // 今日の日付を取得する
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 00:00:00 にリセット
      const todayTimestamp: Timestamp = Timestamp.fromDate(today);

      // 出席状況DBでの検索条件を作成
      const q = query(
        attendanceRef,
        where("No", "==", studentNo),                 // 指定した生徒の No. を検索
        where("Participation", ">=", todayTimestamp)  // 今日の日付のデータだけ取得
      );

      // 条件一致したデータを取得する
      const querySnapshot = await getDocs(q);

      // 指定したデータを削除する
      if (!querySnapshot.empty) {
        for (const document of querySnapshot.docs) {
          await deleteDoc(doc(db, "出席状況", document.id));
          console.log(`No.${studentNo} の出席データ（${document.id}）を削除しました！`);
        }
      } else {
        console.log(`No.${studentNo} のデータは見つかりませんでした`);
      }
    } catch (error) {
      console.error("ドキュメントの削除に失敗しました:", error);
    }
  }


  /** 出席者リストDBに生徒の情報を追加する処理
   * 
   */
  const Addstudent = async (student: any) => {
    try {
      // 新規追加したいデータベースを指定
      const AddDocRef = collection(db, "出席状況");

      // 出席状態にしたい生徒の情報を取得
      const AttendeesAddData = {
        No: student.No,
        Name: student.Name,
        Kana: student.Kana,
        Grade: Number(student.Grade),
        Team: student.Team,
        Participation: serverTimestamp()  // Firestore のサーバー時間を記録
      }

      //出席者リストDBに生徒の情報を追加
      await addDoc( AddDocRef, AttendeesAddData );

      // **students の状態を更新して再レンダリング**
      setStudents((prevStudents: any) => 
        prevStudents.map((student: { id: string; }) =>
          student.id === attendees.id ? { ...student, ...AttendeesAddData } : student
        )
      );

      console.log("データを追加しました！");
    } catch (error) {
      console.error("データを追加に失敗しました:", error);
    }
  }

  // チームラベル色の設定処理
  const LabelBackColor = [ "#FFA7A7", "	#FFD9AE", "#ACDFFF", "#8CB1FF", "	#8ACF94", "	#98E1E3", "#FFF2A6", "#ffc0cb", "#9370db", "#eee8aa" ] 


  /** チームごとのフィルタリング処理
   *  チームラベルのクリック時にクリックしたチームの生徒をテーブルに表示
   */
  const handleTeamClick = (team: string) => {
    // 選択したチーム名を取得
    setSelectedTeam(team);
    console.log('選択されたチーム名',team);

    // 選択されたチームの生徒の情報を配列内に格納
    setFilteredStudents(
      students.filter((student: { Team: string; }) =>student.Team === team) 
    );
    console.log('フィルタリングされた生徒の情報',students.filter((student: { Team: string; }) =>student.Team === team));
  };



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


  // まず既存のフィルター(チームごとのフィルター)を適用する
  const filteredData = selectedTeam
    ? filteredStudents.filter((student: any) => student.Team === selectedTeam): students;

  // 並び替え処理
  const sortTable = [...filteredData].sort((a, b) => {
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
      <div className="TakeAttendance-List">
        <div className="Title-area">
          <h1>出席者リスト</h1>
        </div>
        <div className="button-area">
          <div className="SubTitle-area">
            <h2>チーム一覧</h2>
          </div>
          {/* 登録されているチーム名とそのチーム所属している合計人数をデータベースから全て取得 */}
          {Object.entries(teamCounts).map(([team, count], index) => (
            <button key={team} className="team-label" 
             style={{ backgroundColor: LabelBackColor[index % LabelBackColor.length] }} // ボタンの数が配列内の色の数より多くなっても、繰り返して色を適用
             onClick={() => handleTeamClick(team)}
            >
              <div>{`${team} ( ${count} )`}</div>
            </button>
          ))}
        </div>
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
                <th>
                  <div className="table-label">
                    <label className="table-sort-label">
                      <label className="table-sort-text">
                        出席確認
                      </label>
                    </label>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* 初回表示は `students`、ボタンが押されたら `filteredStudents` でそれぞれ表示する*/}
              {(sortTable).map((student: any) => (
                <tr key={student.No}>
                  <td>{student.Name}</td>   {/* データベースから氏名を取得 */}
                  <td>{student.Kana}</td>   {/* データベースからフリガナを取得 */}
                  <td>{student.Grade}</td>  {/* データベースから学年を取得 */}
                  <td>{student.Team}</td>   {/* データベースからチーム名を取得 */}
                  <td>
                    <button 
                      className={`changebtn ${isPresent[student.No] ? "absent" : "present"}`} 
                      onClick={() => handleClick(student)} // クリックしたボタンだけアクティブにする
                    >
                      {isPresent[student.No] === null ? "確認中..." : isPresent[student.No] ? "－ 欠席へ変更" : "＋ 出席へ変更" }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default TakeAttendance;