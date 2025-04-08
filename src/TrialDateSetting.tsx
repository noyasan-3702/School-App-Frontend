import { useState } from "react";
import { collection,  getDocs, deleteDoc, doc , addDoc, Timestamp } from "firebase/firestore";
import db from "./firebase";
import './App.css'

function TrialDateSetting() {

  // 現在の年、月、日を取得
  const today = new Date();
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth() + 1;


  // 来月の年、月、日を取得
  let nextYear = thisYear;
  let nextMonth = thisMonth + 1;
  if (thisMonth === 12) {
    nextYear = thisYear + 1;
    nextMonth = 1;
  }


  // 日付を指定の型に変更する
  const formatDate = (year: number, month: number, day: number): string => {
    const paddedMonth = month.toString().padStart(2, "0");
    const paddedDay = day.toString().padStart(2, "0");
  
    return `${year}/${paddedMonth}/${paddedDay}`;
  }


  // 今月の未来の木曜・土曜を取得
  const getThursdaysAndSaturdays = (year: number, month: number) => {
    const dates: string[] = [];
    const startDay = today.getDate();
    const lastDay = new Date(year, month, 0).getDate();

    for (let day = startDay ; day <= lastDay; day++) {
      const Thisdate = new Date(year, month - 1, day);
      const dayOfWeek = Thisdate.getDay();
      if (dayOfWeek === 4 || dayOfWeek === 6) {
        Thisdate.setHours(0, 0, 0, 0);
        dates.push(formatDate(year, month, Thisdate.getDate()));
      }
    }
    return dates;
  };


  // 来月の木曜・土曜を取得
  const getNextThursdaysAndSaturdays = (year: number, month: number) => {
    const dates: string[] = [];
    const lastDay = new Date(year, month, 0).getDate();

    for (let day = 1 ; day <= lastDay; day++) {
      const Nextdate = new Date(year, month - 1, day);
      const dayOfWeek = Nextdate.getDay();
      if (dayOfWeek === 4 || dayOfWeek === 6) {
        Nextdate.setHours(0, 0, 0, 0);
        dates.push(formatDate(year, month, Nextdate.getDate()));
      }
    }
    return dates;
  };

  // 今月と来月の体験日を全て取得する
  const practiceDates1 = getThursdaysAndSaturdays(thisYear, thisMonth);
  const practiceDates2 = getNextThursdaysAndSaturdays(nextYear, nextMonth);
  const PracticeDates = [...practiceDates1, ...practiceDates2];

  // チェックボックスの状態を管理
  const [checkedDates, setCheckedDates] = useState<{ [key: string]: boolean }>({});

  // チェックが変更されたときの処理
  const handleCheckboxChange = (date: string) => {
    setCheckedDates((prev) => ({
      ...prev,
      [date]: !prev[date], // チェックのON/OFFを切り替え
    }));
  };

  // チェックされた日付を取得
  const getCheckedDates = () => {

    // データベース内の練習日の情報を全て削除
    deleteAllDocuments();

    // チェックされた日付を取得
    const selectedDates = Object.keys(checkedDates).filter((date) => checkedDates[date]);
    console.log("チェックされた日付:", selectedDates);

    // 『YYYY/MM/DD』の型からTimestamp型に変換
    const timestampArray = selectedDates.map(convertToTimestamp);

    // 選択された練習日の情報を追加
    AddPracticeDates(timestampArray);
    alert('情報をデータベース内に格納しました！')
  };

  // "YYYY/MM/DD" を Timestamp に変換する関数
  const convertToTimestamp = (dateStr: string): Timestamp => {
    const [year, month, day] = dateStr.split("/").map(Number);
    const dateObj = new Date(year, month - 1, day); // ⚠️ 月は 0 から始まるので -1 する
    return Timestamp.fromDate(dateObj);
  };

  /** 練習予定日データベースに登録された練習日の情報を削除する処理
   * 
   */
  const deleteAllDocuments = async () => {
    const querySnapshot = await getDocs(collection(db, "実施予定日一覧")); // 🔹 コレクションの全データ取得
  
    querySnapshot.forEach(async (document) => {
      await deleteDoc(doc(db, "実施予定日一覧", document.id)); // 🔹 各ドキュメントを削除
    });
    
    console.log("全てのデータを削除しました！");
  };


  /** 練習予定日データベースに選択された練習日の情報を追加する処理
   * 
   */
  const AddPracticeDates = async (Dates: Timestamp[]) => {
    try {
      // 登録したいデータベースを指定
      const PracticeDocRef = collection(db, "実施予定日一覧");

      // 練習予定日データベースに練習日の情報を追加
      for (const date of Dates) {
        await addDoc(PracticeDocRef, { scheduled_date: date });
      }

      console.log("データを追加しました！");
    } catch (error) {
      console.error("データを追加に失敗しました:", error);
    }
  }
  
  return (
    <>
    <div className="TrialDateSetting-List">
      <div className="Title-area">
        <h1>体験日設定</h1>
      </div>
      <div className="List-area">
        <table>
          <thead>
            <tr>
              <th>
                <div className="table-link-box">
                  <label className="table-link-text">
                    練習日・体験日
                  </label>
                </div>
              </th>
              <th>
                <div className="table-link-box">
                  <label className="table-link-text">
                    選択してください
                  </label>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {PracticeDates.map((date) => (
              <tr key={date}>
                <td>{date}</td>
                <td>
                  <label className="my-taskcheck">
                    <input 
                      type="checkbox" className="taskcheck"
                      checked={checkedDates[date] || false}
                      onChange={() => handleCheckboxChange(date)}
                    />
                    <span className="checkmark"></span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="editbtn" onClick={getCheckedDates}>確定</button>
    </div>
    </>
  );
}
  
export default TrialDateSetting;