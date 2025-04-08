import { useEffect, useState, } from "react";
import { collection, getDocs, Timestamp, query, where, addDoc } from "firebase/firestore";
import IncomeChart from "./IncomeChart"; // 収入グラフのコンポーネントを読み込む
import db from "./firebase";
import Slider from "react-slick";
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import './App.css'

interface AmountData {
  id?: string;
  No?: number;
  Type?: string;
  Amount?: number;
  Participation?: string;
}

function BudgetBook() {

  // データベースから取得した全ての金額情報を管理
  const [ revenues, setRevenues ] = useState<any>([]);

  // 合計収入を管理
  const [ allAmount, setAllAmount ] = useState<number>(0);

  // 合計収支を管理
  const [ allexpenditure, setAllexpenditure ] = useState<number>(0)

  // 月ごとの収入を管理
  const [ monthlyTotals, setMonthlyTotals ] = useState<Record<string, number>>({});

  // データベースの接続状況を管理
  const [ loading, setLoading ] = useState(true);

  // Firestore からデータを取得する
  const today = new Date();
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Firestore の "出席状況" コレクションを参照
        console.log("データ取得開始...");
        const attendanceRef = collection(db, "出席状況");

        // 2024年7月から今日の日付までの練習日を取得
        const practiceDates = getThursdaysAndSaturdays();

          // Firestore から該当日の出席者を取得
        const queries = practiceDates.map(async (date) => {
          const startTimestamp =  date instanceof Timestamp ? date : Timestamp.fromDate(date);
          const endDate = new Date(date.toDate());
          endDate.setHours(23, 59, 59, 999); // 時間を 23:59:59 に設定
          const endTimestamp = Timestamp.fromDate(endDate);
          
          // 当日クエリを作成
          const q = query(
            attendanceRef,
            where("Participation", ">=", startTimestamp),
            where("Participation", "<", endTimestamp)
          );

          // Firestore からデータを取得
          const querySnapshot = await getDocs(q);
          const AmountData = querySnapshot.docs.map((doc) => doc.data());

          // 結果を配列に追加
          return {
            date: `${date.toDate().getFullYear()}/${(date.toDate().getMonth() + 1).toString().padStart(2, "0")}`,
            people: AmountData.length,
            amount: AmountData.length * 1000,
          };
        });

        // 収入データを格納する配列を用意
        const pastDataArray = await Promise.all(queries);

        // `pastDataArray` の `amount` の合計を求める
        setAllAmount(pastDataArray.reduce((sum, item) => sum + item.amount, 0));

        // `date` ごとのamount合計を計算
        const totals = pastDataArray.reduce((acc: Record<string, number>, curr) => {
          if (!acc[curr.date]) acc[curr.date] = 0;
          acc[curr.date] += curr.amount;
          return acc;
        }, {} as Record<string, number>);
        setMonthlyTotals(totals);


        // Firestore の "収益状況" コレクションを参照
        const EarningsStatusRef = collection(db, "収益状況");
        const EarningsSnapshot = await getDocs(EarningsStatusRef);

        // Firestore の "収益状況" データを全て取得し、id を含めたオブジェクトを作成
        const EarningsList: AmountData[] = EarningsSnapshot.docs.map(doc => {
          const data = doc.data() as Omit<AmountData, "id">; 
          return { id: doc.id, ...data };
        });
        setRevenues(EarningsList)
        console.log("集計結果:", EarningsList);

        // 収入クエリを作成
        const income_q = query(
          EarningsStatusRef,
          where("Type", "==", "収入")
        );

        // Firestore からデータを取得
        const incomeSnapshot = await getDocs(income_q);
        const IncomeData = incomeSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id, // ドキュメントのIDも一緒に入れる
            Participation: data.Participation,
            Amount: data.Amount
          };
        });

        // `IncomeData` の `amount` の合計を求めて、合計収入の値を算出
        const totalIncome = IncomeData.reduce((sum, item) => sum + item.Amount, 0);
        setAllAmount(prev => prev + totalIncome);

        // 収入クエリを作成
        const expenditure_q = query(
          EarningsStatusRef,
          where("Type", "==", "支出")
        );

        // Firestore からデータを取得
        const expenditureSnapshot = await getDocs(expenditure_q);
        const ExpenditureData = expenditureSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id, // ドキュメントのIDも一緒に入れる
            Participation: data.Participation,
            Amount: data.Amount
          };
        });

        // `ExpenditureData` の `amount` の合計を求めて、合計支出の値を算出
        const totalExpenditure = ExpenditureData.reduce((sum, item) => sum + item.Amount, 0);
        setAllexpenditure(prev => prev + totalExpenditure);

        console.log("データ取得完了！");

      } catch (error) {
        console.error("データの取得に失敗しました", error);
      }
    };

    // 関数の実行
    fetchData();
    setLoading(false);
  }, []);


  // 現在までの木曜・土曜の練習日を取得
  const getThursdaysAndSaturdays = () => {
    const dates: Timestamp[] = [];
    const toyear = today.getFullYear();
    const tomonth = today.getMonth();

    // 2024年7月から今日の日付までの出席状況を取得して、合計収入を集計
    for (let year = 2024; year <= toyear; year++) {

      // 開始月と最終月を取得
      const startMonth = year === 2024 ? 6 : 0; // 7月スタート（月は0始まりなので6）
      const lastMonth = year === toyear ? tomonth : 11;
      for (let month = startMonth; month <= lastMonth; month++) {

        // 最終日を取得
        const lastDay =
        year === toyear && month === tomonth
          ? today.getDate()
          : new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= lastDay; day++) {
          const date = new Date(year, month, day);
          const dayOfWeek = date.getDay();
          if (dayOfWeek === 4 || dayOfWeek === 6) {
            date.setHours(0, 0, 0, 0);
            dates.push(Timestamp.fromDate(date));
          }
        }      
      }
    }
    return dates;
  };


  // 合計収益を算出する
  const Totalrevenue = () => {
    const Total = allAmount - allexpenditure
    return FormatAmount(Total)
  }


  // 追加したい金額情報を管理する
  const [ addData, setAddData ] = useState<AmountData | null>(null);

  // 新規追加ポップアップの表示・非表示を管理
  const [ isaddPopupVisible, setIsaddPopupVisible ] = useState(false);

  // 新規追加ポップアップを開く
  const AddOpenPopup = () => {
    setIsaddPopupVisible(true);
  };

  // 新規追加ポップアップを閉じる
  const AddClosePopup = () => {
    setIsaddPopupVisible(false);
  };

  // 入力された内容をリアルタイムで更新
  const AddhandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (setAddData) {
      const { name, value } = e.target;
      setAddData({...addData, [name]: value});
    }
  };

  //追加した金額情報を保存する
  const AddHandleSave = async () => {
    if (!addData) return;
    try {

      // 追加したいデータベースを指定
      const AmounDataAddDocRef = collection(db, "収益状況");

      // 現在の金額情報数を取得
      const snapshot = await getDocs(AmounDataAddDocRef);
      const AmounDataCount: number = snapshot.size; 

      // 追加したい金額情報の情報を取得
      const studentAddData = {
        No: AmounDataCount + 1,
        Type: addData.Type,
        Amount: Number(addData.Amount),
        Participation: FormatDate(addData.Participation)
      };

      // 収益状況データベースに金額情報を新規追加する
      await addDoc( AmounDataAddDocRef, studentAddData );

      // 状態を更新して再レンダリング**
      setAddData((prevDatas: any) => 
        prevDatas.map((data: { id: string; }) =>
          data.id === addData.id ? { ...data, ...studentAddData } : data
        )
      );
      // ポップアップを閉じる
      setIsaddPopupVisible(false);

    } catch (error) {

      // 新規追加が失敗したとき
      console.error("金額情報の追加に失敗しました:", error);
      alert("金額情報の追加に失敗しました");

      // ポップアップを閉じる
      setIsaddPopupVisible(false);
    }
  }

  // カレンダーから取得した日付をタイムスタンプ型に変換
  const FormatDate = (Datevalue: string | undefined): Timestamp | null => {
    if (!Datevalue) return null; // 未入力なら null を返す

    const [yearStr, monthStr] = Datevalue.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);

    // 数値変換に失敗した場合のチェック
    if (isNaN(year) || isNaN(month)) return null;

    const date = new Date(year, month - 1); // JavaScript の月は 0 から始まる
    return Timestamp.fromDate(date);
  }

  // タイムスタンプ型から『yyyy/mm』の形式に変換する
  const FormatTimestamp = (Tdate: Timestamp) => {
    const date = Tdate.toDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${year}/${month}`
  }

  // 合計収益を算出する
  const FormatAmount = (FAmount: number) => {
    return FAmount.toLocaleString()
  }

  // スライダーの設定
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };
  
  return (
  <>
    <div className="BudgetBook-List">
      <div className="Popup-area">
        {/* 新規追加Popup */}
        {isaddPopupVisible && (
          <div className="Popup-overlay">
            <div className="Add-popup">
              <div className="Popup-header">
                <button className="PopupClosebtn" onClick={AddClosePopup}>✕</button>
                <h4 className="Header-title">収入・支出データ追加</h4>
              </div>
              <div className="Popup-body">
                <div className="Body-element">
                  <h4 className="SubTitle">種別</h4>
                    <input 
                    type="text"
                    list="DatalistId"
                    name="Type"
                    value={addData?.Type} 
                    onChange={AddhandleChange}
                    />
                  <datalist id="DatalistId">
                    <option value="収入"></option>
                    <option value="支出"></option>
                  </datalist>
                </div>
                <div className="Body-element">
                  <h4 className="SubTitle">期間</h4>
                    <input 
                     type="month" 
                     name="Participation" 
                     value={addData?.Participation} 
                     onChange={AddhandleChange}
                    />
                </div>
                <div className="Body-element">
                  <h4 className="SubTitle">金額</h4>
                    <input 
                    type="number"
                    name="Amount" 
                    value={addData?.Amount} 
                    onChange={AddhandleChange}
                    />
                </div>
              </div>
              <div className="Popup-button">
                <button className="addbtn" onClick={AddHandleSave} >追加</button>
              </div>
            </div>
          </div>
        )}
        </div>
      <div className="Title-area">
        <h1>管理簿</h1>
      </div>
      <div className="Totalling-area">
        <div className="List-area">
          <table>
            <thead>
              <tr>
                <th>合計収入</th>
                <th>合計支出</th>
                <th>合計収益</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{loading ? '読み込み中...' : `+ ${allAmount.toLocaleString()}円`}</td>
                <td>{loading ? '読み込み中...' : `- ${allexpenditure.toLocaleString()}円`}</td>
                <td>{loading ? '読み込み中...' : `${Totalrevenue()}円`}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <Slider {...settings}>
        <div className="Graph-area">
          <div className="Title-area">
            <h2>収入グラフ</h2>
          </div>
          {/* ここでグラフを表示 */}
          <IncomeChart
            data={Object.entries(monthlyTotals).map(([date, amount]) => ({
              date,
              amount,
            }))}
          />
          <p>※年会費は収入グラフには含まれておりません</p>
        </div>
        <div className="input-area">
          <div className="Title-area">
              <h2>その他の収入・支出</h2>
              <button className="addbtn" onClick={AddOpenPopup}>データ追加</button>
            </div>
          <div className="List-area">
            <table>
              <thead>
                <tr>
                  <th>収入・支出</th>
                  <th>期間</th>
                  <th>金額</th>
                  <th>編集</th>
                  <th>削除</th>
                </tr>
              </thead>
              <tbody>
                {(revenues).map((revenue: any) => (
                  <tr key={revenue.id}>
                    <td>{revenue.Type}</td>{/* データベースから種別を取得 */}
                    <td>{FormatTimestamp(revenue.Participation)}</td>{/* データベースから年月を取得 */}
                    <td>{FormatAmount(revenue.Amount)}</td>{/* データベースから金額を取得 */}
                    <td><button className="editbtn">編集</button></td>
                    <td><button className="deletebtn">削除</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Slider>
    </div>
  </>
  );
}
  
export default BudgetBook;