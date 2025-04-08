import { useEffect, useState, } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import db from "./firebase";
import QRDisplay from "./components/QRDisplay";
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

function AllList() {
  const [ students, setStudents ] = useState<any>([]);                            // データベースから取得した全ての生徒の情報を管理
  const [ isaddPopupVisible, setIsaddPopupVisible ] = useState(false);            // 新規追加ポップアップの表示・非表示を管理
  const [ iseditPopupVisible, setIseditPopupVisible ] = useState(false);          // 編集ポップアップの表示・非表示を管理
  const [ isdeletePopupVisible, setIsdeletePopupVisible ] = useState(false);      // 削除ポップアップの表示・非表示を管理
  const [ teams, setTeams ] = useState<any>([]);                                  // データベース内のチーム名を管理
  const [, setTeamName ] = useState("");                                          // 表示したいチーム名を管理
  const [ selectedTeam, setSelectedTeam ] = useState<string | null>(null);        // 選択されたチームを管理する
  const [ filteredStudents, setFilteredStudents ] = useState<any[]>([]);          // 表示する生徒リストを管理する
  const [ teamCounts, setTeamCounts ] = useState<{ [team: string]: number }>({}); // チーム内の合計人数を管理する
  const [ addStudent, setAddStudent ] = useState<Student | null>(null);           // 追加したい生徒の情報を管理する
  const [ editStudent, setEditStudent ] = useState<Student | null>(null);         // 編集したい生徒の情報を管理する
  const [ deleteStudent, setDeleteStudent ] = useState<Student | null>(null);     // 削除したい生徒の情報を管理する                  
  const [ sortConfig, setSortConfig ] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);


  /** 初回レンタリングの処理
   * 初回レンタリングの処理の処理となります。
   * 
   * 生徒一覧データベースから全ての生徒の情報を取得します。
   * 
   * また、チーム名を重複を削除して取り出し、
   * 編集ポップアップや新規追加ポップアップで使用可能な
   * ドロップダウンリストのデータを取得しています。
  */
  useEffect(() => {
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

        // "Team" の値を抽出し、重複を削除してデータを state にセット
        const teamList = [...new Set(studentList.map(student => student.Team))];
        setTeams(teamList);

        // チームごとの人数を集計して、集計結果を state にセット 
        const teamCountMap = new Map<string, number>();
        studentList.forEach((studentList: { Team: string; }) => {
          if (studentList.Team) {
            teamCountMap.set(studentList.Team, (teamCountMap.get(studentList.Team) || 0) + 1);
          }
        });
        setTeamCounts(Object.fromEntries(teamCountMap));

        // デバッグ用のログ出力
        console.log("取得した生徒の一覧:", studentList);
        console.log("取得したチーム一覧:", teamList);
        console.log("取得したチームの合計人数:", teamCounts);
      } catch (error) {
        console.error("データの取得中にエラーが発生しました:", error);
      }
    };

    fetchData();  // 関数を実行
  }, []);



  /** 編集ポップアップの処理 
   * 編集ポップアップの処理となります。
   * 
   * 生徒一覧データベースからテーブル内の同じ行内の生徒情報を編集します。
   * 
   * 編集可能項目
   * 氏名、フリガナ、学年、チーム名、連絡先（電話番号）、メールアドレス
  */
  // 編集ポップアップを開く
  const EditOpenPopup = (student: any) => {
    setEditStudent(student);      // 編集したい生徒の情報を格納
    setIseditPopupVisible(true);  // 編集ポップアップを開く
  }

  // 編集ポップアップを閉じる
  const EditClosePopup = () => {
    setIseditPopupVisible(false);
  };

  // 入力された内容をリアルタイムで更新
  const EdithandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editStudent) {
      const { name, value } = e.target;
      setEditStudent({...editStudent, [name]: value});
    }
  };

  //編集内容を保存する
  const EditHandleSave = async () => {
    if (!editStudent) return;
    try {
      // 更新したいデータベースから編集したい生徒のドキュメントIDを指定
      const studentEditDocRef = doc(db, "生徒一覧", editStudent.id);

      // 編集したい生徒の情報を取得
      const studentEditData = {
        Name: editStudent.Name,
        Kana: editStudent.Kana,
        Grade: Number(editStudent.Grade),
        Team: editStudent.Team,
        Phone: editStudent.Phone,
        Mail: editStudent.Mail
      };

      // データベースの情報を更新
      await updateDoc( studentEditDocRef, studentEditData );

      // **students の状態を更新して再レンダリング**
      setStudents((prevStudents: any) => 
        prevStudents.map((student: { id: string; }) =>
          student.id === editStudent.id ? { ...student, ...studentEditData } : student
        )
      );

      // ポップアップを閉じる
      setIseditPopupVisible(false);
    } catch (error) {

      // 更新が失敗したとき
      alert("データの更新に失敗しました");  // アラートを表示
      console.error("更新エラー:", error);

      // ポップアップを閉じる
      setIseditPopupVisible(false);
    }
  }

    

  /** 新規追加ポップアップの処理 
   * 新規追加ポップアップの処理となります。
   * 
   * 生徒一覧データベースに新規で生徒の情報を追加します。
  */
  // 新規追加ポップアップを開く
  const AddOpenPopup = (student: any) => {
    setAddStudent(student);
    setIsaddPopupVisible(true);
  };

  // 新規追加ポップアップを閉じる
  const AddClosePopup = () => {
    setIsaddPopupVisible(false);
  };

  // 入力された内容をリアルタイムで更新
  const AddhandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (addStudent) {
      const { name, value } = e.target;
      setAddStudent({...addStudent, [name]: value});
    }
  };

  //新規追加した生徒の情報を保存する
  const AddHandleSave = async () => {
    if (!addStudent) return;
    try {

      // 新規追加したいデータベースを指定
      const studentAddDocRef = collection(db, "生徒一覧");

      // 現在の生徒数を取得
      const snapshot = await getDocs(studentAddDocRef);
      const studentCount: number = snapshot.size; 

      // 新規追加したい生徒の情報を取得
      const studentAddData = {
        No: studentCount + 1,
        Name: addStudent.Name,
        Kana: addStudent.Kana,
        Grade: Number(addStudent.Grade),
        Team: addStudent.Team,
        Phone: addStudent.Phone,
        Mail: addStudent.Mail
      };

      // 生徒一覧データベースに生徒の情報を新規追加する
      await addDoc( studentAddDocRef, studentAddData );

      // **students の状態を更新して再レンダリング**
      setStudents((prevStudents: any) => 
        prevStudents.map((student: { id: string; }) =>
          student.id === addStudent.id ? { ...student, ...studentAddData } : student
        )
      );
      // ポップアップを閉じる
      setIsaddPopupVisible(false);

    } catch (error) {

      // 新規追加が失敗したとき
      console.error("生徒の追加に失敗しました:", error);
      alert("生徒の追加に失敗しました");

      // ポップアップを閉じる
      setIsaddPopupVisible(false);
    }
  }



  /** 削除ポップアップの処理 
   * 削除ポップアップの処理となります。
   * 
   * 生徒一覧データベースからテーブル内の同じ行内の生徒情報を削除します。
  */
  // 削除ポップアップを開く
  const DeleteOpenPopup = (student: any) => {
    setDeleteStudent(student)
    setIsdeletePopupVisible(true);
  };

  // 削除ポップアップを閉じる
  const DeleteClosePopup = () => {
    setIsdeletePopupVisible(false);
  };

  //生徒の情報を削除する
  const DeleteExecution = async () => {
    if (!deleteStudent) return;
    try {
      // 生徒一覧 のデータベースから指定した生徒の情報をを削除
      await deleteDoc(doc(db, "生徒一覧", deleteStudent.id));

      // `students` の状態を更新して、削除されたデータを UI からも消す
      setStudents((prevStudents: any) => 
        prevStudents.filter((student: { id: string; }) => 
        student.id !== deleteStudent.id)
      );

      // ポップアップを閉じる
      setIsdeletePopupVisible(false);
    } catch (error) {

      // 削除が失敗したとき
      alert("データの更新に失敗しました");  // アラートを表示
      console.error("更新エラー:", error);

      // ポップアップを閉じる
      setIsdeletePopupVisible(false);
    }
  }



  /**チームごとのフィルタリング処理
   * チームラベルのクリック時にクリックしたチームの生徒をテーブルに表示
   */
  // 
  // チームラベル色の設定処理
  const LabelBackColor = [ "#FFA7A7", "	#FFD9AE", "#ACDFFF", "#8CB1FF", "	#8ACF94", "	#98E1E3", "#FFF2A6", "#ffc0cb", "#9370db", "#eee8aa" ] 

  // チームラベルのボタン処理
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
    ? filteredStudents.filter((student: any) => student.Team === selectedTeam)
    : students;

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

  const [QRInfo, setQRInfo] = useState<number>(0);
  const [QRDisplayOpen, setQRDisplayOpen] = useState(false);

  /**
   * 出席・事前予約に使用するQRを発行します。
   * @param student 生徒情報
   * @returns なし
   */
  const createQRCode = (student: Student) => {
    setQRDisplayOpen(true);
    /** IDではなくNoの可能性がある */
    setQRInfo(student.No);
  };

  /** QRコードの表示領域を閉じる関数 */
  const onCloseQRDisplay = () => {
    setQRDisplayOpen(false);
  };

  return (
    <>
      <div className="AllList">
        {/* QRコードの表示領域 */}
        {QRDisplayOpen && (
          <QRDisplay QRInfo={String(QRInfo)} onCloseQRDisplay={onCloseQRDisplay} />
        )}
        <div className="Popup-area">
          {/* 新規追加Popup */}
          {isaddPopupVisible && (
            <div className="Popup-overlay">
              <div className="Add-popup">
                <div className="Popup-header">
                  <button className="PopupClosebtn" onClick={AddClosePopup}>✕</button>
                  <h4 className="Header-title">メンバーの新規追加</h4>
                </div>
                <div className="Popup-body">
                  <div className="Body-element">
                    <h4 className="SubTitle">氏名</h4>
                    <input type="text" name="Name" value={addStudent?.Name} onChange={AddhandleChange} className="inputer1" />
                  </div>
                  <div className="Body-element">
                    <h4 className="SubTitle">フリガナ</h4>
                    <input type="text" name="Kana" value={addStudent?.Kana} onChange={AddhandleChange} className="inputer1" />
                  </div>
                  <div className="Body-element">
                    <h4 className="SubTitle">学年</h4>
                    <input type="number" name="Grade" value={addStudent?.Grade} onChange={AddhandleChange} min="1" max="6" className="inputer2" />
                  </div>
                  <div className="Body-element">
                    <h4 className="SubTitle">チーム</h4>
                    <input list="teams" name="Team" value={addStudent?.Team}   
                      onChange={(e) => {
                        AddhandleChange(e);           // 内容を一時保存(配列内に格納)
                        setTeamName(e.target.value);  // チーム名を取得
                      }} 
                      placeholder="選択または入力" className="inputer1" 
                    />
                    <datalist id="teams">
                      {teams.map((team: string, index: number) => (
                        <option key={index} value={team} />
                      ))}
                    </datalist>
                  </div>
                  <div className="Body-element">
                    <h4 className="SubTitle">連絡先</h4>
                    <input type="tel" name="Phone" value={addStudent?.Phone} onChange={AddhandleChange} className="inputer1" />
                  </div>
                  <div className="Body-element">
                    <h4 className="SubTitle">メールアドレス</h4>
                    <input type="email" name="Mail" value={addStudent?.Mail} onChange={AddhandleChange} className="inputer1" />
                  </div>
                  <div className="Popup-button">
                    <button className="addbtn" onClick={AddHandleSave}>新規追加する</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 編集Popup */}
            {iseditPopupVisible && (
            <div className="Popup-overlay">
              <div className="Edit-popup">
                <div className="Popup-header">
                  <button className="PopupClosebtn" onClick={EditClosePopup}>✕</button>
                  <h4 className="Header-title">メンバー情報の編集</h4>
                </div>
                <div className="Popup-body">
                  <div className="Body-element">
                    <h4 className="SubTitle">氏名</h4>
                    <input type="text" name="Name"  value={editStudent?.Name || ""} onChange={EdithandleChange} className="inputer1" />
                  </div>
                  <div className="Body-element">
                    <h4 className="SubTitle">フリガナ</h4>
                    <input type="text" name="Kana" value={editStudent?.Kana || ""} onChange={EdithandleChange} className="inputer1" />
                  </div>
                  <div className="Body-element">
                    <h4 className="SubTitle">学年</h4>
                    <input type="number" name="Grade" value={editStudent?.Grade || ""} onChange={EdithandleChange} min="1" max="6" className="inputer2" />
                  </div>
                  <div className="Body-element">
                    <h4 className="SubTitle">チーム</h4>
                    <input list="teams" name="Team" value={editStudent?.Team || ""} 
                      onChange={(e) => {
                        EdithandleChange(e);          // 編集内容を一時保存(配列内に格納)
                        setTeamName(e.target.value);  // チーム名を取得
                      }} 
                      placeholder="選択または入力" className="inputer1" 
                    />
                    <datalist id="teams">
                      {teams.map((team: string, index: number) => (
                        <option key={index} value={team} />
                      ))}
                    </datalist>
                  </div>
                  <div className="Body-element">
                    <h4 className="SubTitle">連絡先</h4>
                    <input type="tel" name="Phone" value={editStudent?.Phone || ""} onChange={EdithandleChange} className="inputer1" />
                  </div>
                  <div className="Body-element">
                    <h4 className="SubTitle">メールアドレス</h4>
                    <input type="email" name="Mail" value={editStudent?.Mail || ""} onChange={EdithandleChange} className="inputer1" />
                  </div>
                  <div className="Popup-button">
                    <button className="editbtn" onClick={EditHandleSave}>編集内容を確定する</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* 削除Popup */}
          {isdeletePopupVisible && (
            <div className="Popup-overlay">
              <div className="Delete-popup">
                <div className="Popup-body">
                  <div className="DeleteName">
                    <p>{deleteStudent?.Name}を削除します。</p>
                    <p>よろしいですか？</p>
                  </div>
                  <div className="Popup-button">
                    <button className="deletebtn" onClick={DeleteExecution}>はい</button>
                    <button className="cancelbtn" onClick={DeleteClosePopup}>キャンセル</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="Title-area">
          <h1>メンバーリスト</h1>
          <button className="addbtn" onClick={AddOpenPopup}>＋生徒追加</button>
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
              <div>{`${team} (${count})`}</div>
            </button>
          ))}
        </div>
        <div className="List-area">
          <div className="SubTitle-area">
            <h2>選手一覧</h2>
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
                  <div className="table-label">
                    <label className="table-sort-label">
                      <label className="table-sort-text">
                        編集
                      </label>
                    </label>
                  </div>
                </th>
                <th>
                  <div className="table-label">
                    <label className="table-sort-label">
                      <label className="table-sort-text">
                        削除
                      </label>
                    </label>
                  </div>
                </th>
                <th>
                  <div className="table-label">
                    <label className="table-sort-label">
                      <label className="table-sort-text">
                        発行
                      </label>
                    </label>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* 初回表示は `students`、ボタンが押されたら `filteredStudents` でそれぞれ表示する*/}
              {(sortTable).map((student: any) => (
                <tr key={student.id}>
                  <td>{student.Name}</td>{/* データベースから氏名を取得 */}
                  <td>{student.Kana}</td>{/* データベースからフリガナを取得 */}
                  <td>{student.Grade}</td>{/* データベースから学年を取得 */}
                  <td><button className="editbtn" onClick={() => EditOpenPopup(student)}>編集</button></td>
                  <td><button className="deletebtn" onClick={() => DeleteOpenPopup(student)}>削除</button></td>
                  <td><button className="editbtn" onClick={() => createQRCode(student)}>発行</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default AllList;