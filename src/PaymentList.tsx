import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import db from "./firebase";
import styles from "./PaymentList.module.css";

// Firestore から取得するデータの型
interface PrepaidUser {
  Name: string;
  Grade: number;
  Kana: string;
  joinDate: string;
  PaymentDate: string;
}

export const PaymentList = () => {
  // Firestore から取得したデータを格納するステート
  const [paymentList, setPaymentList] = useState<PrepaidUser[]>([]);
  console.log("PPL", paymentList);

  // Firestore からデータを取得
  useEffect(() => {
    const getPaymentData = async () => {
      try {
        // 事前決済者一覧コレクションの参照を作成
        const prepaidCollectionRef = collection(db, "事前決済者一覧");

        // Firestore からデータを取得
        const snapshot = await getDocs(prepaidCollectionRef);

        const prepaidUsers: PrepaidUser[] = snapshot.docs.map(
          (doc) => doc.data() as PrepaidUser
        );

        // 取得したデータを state にセット
        setPaymentList(prepaidUsers);

        console.log("取得した事前決済者データ:", prepaidUsers);
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
      }
    };

    getPaymentData();
  }, []);

  return (
    <div className={styles.payment}>
      <h1>事前決済者一覧</h1>

      {/* データがない場合の処理 */}
      {paymentList.length === 0 ? (
        <p>データがありません</p>
      ) : (
        <div className="List-area">
          <table>
            <thead>
              <tr>
                <th>氏名</th>
                <th>フリガナ</th>
                <th>学年</th>
                <th>参加予定日</th>
                <th>決済日</th>
              </tr>
            </thead>
            <tbody>
              {/* 取得したデータをマッピングしてテーブル表示 */}
              {paymentList.map((user, index) => (
                <tr key={index}>
                  <td>{user.Name}</td>
                  <td>{user.Kana}</td>
                  <td>{user.Grade}</td>
                  <td>{user.joinDate}</td>
                  <td>
                    {new Date(user.PaymentDate).toLocaleDateString("ja-JP")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
