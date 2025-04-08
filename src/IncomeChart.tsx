import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

// Chart.js の設定（これをしないと動かない）
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type IncomeChartProps = {
  data: { date: string; amount: number }[];
};

const IncomeChart: React.FC<IncomeChartProps> = ({ data }) => {
  // グラフ用のデータ
  const chartData = {
    labels: data.map((item) => item.date), // X軸（年月）
    datasets: [
      {
        label: "収入額 (円)",
        data: data.map((item) => item.amount), // Y軸（収入額）
        backgroundColor: "rgba(54, 162, 235, 0.5)", // 青色
      },
    ],
  };

  return (
    <div className="chart-wrapper">
      <Bar data={chartData} />
    </div>
  );
};

export default IncomeChart;
