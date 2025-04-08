import { DocumentData, Timestamp } from "firebase/firestore";
import { Fragment } from "react";
import styles from "./ReserveForm.module.css";

type StudentData = {
  Grade: number;
  Kana: string;
  Mail: string;
  Name: string;
  No: number;
  Phone: string;
  Team: string;
};

type ScheduledDate = {
  scheduled_date: Timestamp;
};

export const ReserveForm = ({
  studentData,
  scheduledDate,
  setJoinDate,
}: {
  studentData: DocumentData;
  scheduledDate: DocumentData;
  setJoinDate: (date: string) => void;
}) => {
  return (
    <>
      {studentData.map((data: StudentData, index: number) => (
        <div key={index} className={styles.form}>
          <p>名前</p>
          <p>{data.Name}</p>
          <p>フリガナ</p>
          <p>{data.Kana}</p>
          <p>学年</p>
          <p>{data.Grade}</p>
          <p>所属チーム</p>
          <p>{data.Team}</p>
          <p className={styles.last}>参加日</p>
          <p>
            <select
              name="join"
              id="join"
              onChange={(e) => setJoinDate(e.currentTarget.value)}
            >
              <option value="" hidden>
                選んでください
              </option>
              {scheduledDate.map((data: ScheduledDate, index: number) => (
                <Fragment key={index}>
                  <option
                    value={data.scheduled_date
                      .toDate()
                      .toLocaleDateString("ja-JP")}
                  >
                    {data.scheduled_date.toDate().toLocaleDateString("ja-JP")}
                  </option>
                </Fragment>
              ))}
            </select>
          </p>
        </div>
      ))}
    </>
  );
};
