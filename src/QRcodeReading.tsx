import { addDoc, collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { useZxing } from "react-zxing";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import db from "./firebase";
import styles from "./QRcodeReading.module.css";

//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//// 読み込みフローの整理
//// ・「読み込み完了」をどうやって判断させるか
//// ・間違えて2回目以上同じ人が読み込んだときにどうするか
//////////////////////////////////////////////////
//////////////////////////////////////////////////
//////////////////////////////////////////////////

function QRcodeReading() {
  const { ref } = useZxing({
    onDecodeResult: async (result) => {
      try {
        // QRコードから URL を取得
        const url = result.getText();
        const urlObj = new URL(url);
        const studentNo = urlObj.searchParams.get("no");

        // studentNo が取得できているか確認
        if (!studentNo) {
          console.error("Noが取得できませんでした");
          alert("QRコードの情報が不正です");
          return;
        }

        // `生徒一覧` から studentNo に合致するデータを検索
        const studentListQuery = query(collection(db, "生徒一覧"), where("No", "==", parseInt(studentNo)));

        const querySnapshot = await getDocs(studentListQuery);

        if (querySnapshot.empty) {
          console.error("該当する生徒が見つかりません");
          alert("該当する生徒が見つかりません");
          return;
        }

        //  生徒データを取得
        const studentData = querySnapshot.docs[0].data();

        // `出席状況` に生徒データを追加
        const joinSituation = collection(db, "出席状況");

        const attendanceData = {
          No: studentData.No,
          Name: studentData.Name,
          Kana: studentData.Kana,
          Grade: studentData.Grade,
          Participation: Timestamp.now(),
          Team: studentData.Team,
        };

        await addDoc(joinSituation, attendanceData);

        console.log("出席状況にデータを追加しました:", attendanceData);
        toast.success(`${studentData.Name} さんの出席が記録されました`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      } catch (error) {
        console.error("データ処理中にエラーが発生しました:", error);
        toast.error("エラーが発生しました。再試行してください。", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      }
    },
  });

  return (
    <div className={styles.qr}>
      <video ref={ref} />
      <p>QRコードを読み取ってください</p>
      <ToastContainer />
    </div>
  );
}

export default QRcodeReading;
