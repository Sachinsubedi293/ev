import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import ChartDataLabels from 'chartjs-plugin-datalabels';

const BarChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");

    // Destroy previous chart instance if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Ensure data prop has the correct structure
    const { labels, values } = data;

    // Combine labels and values, and sort by values
    const sortedData = values
      .map((value, index) => ({ label: labels[index], value }))
      .sort((a, b) => b.value - a.value);

    // Arrange the data: 2nd highest, highest, 3rd highest
    const arrangedData = [sortedData[1], sortedData[0], sortedData[2]];

    // Extract the rearranged labels and values
    const arrangedLabels = arrangedData.map(d => d.label);
    const arrangedValues = arrangedData.map(d => d.value);
    const colors = ["rgb(54, 162, 235,0.3)", "rgb(255, 206, 86,0.3)", "rgb(255, 99, 132,0.3)"];

    // Create new chart instance
    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: arrangedLabels,
        datasets: [
          {
            label: "Marks",
            data: arrangedValues,
            backgroundColor: colors,
            borderColor: colors.map(color => color.replace('rgb', 'rgba').replace(')', ', 0.1)')),
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Marks",
            },
          },
          x: {
            title: {
              display: true,
              text: "Top3",
            },
          },
        },
        plugins: {
          datalabels: {
            anchor: 'end',
            align: 'start',
            formatter: (value, context) => {
              const rank = context.dataIndex;
              return `${rank === 1 ? '1st' : rank === 0 ? '2nd' : '3rd'}`;
            },
            color: '#333', // Change to white for better contrast
            font: {
              size: 18,
              weight: 'bold'
            },
         
            borderRadius: 4,
            padding: 10,
          }
        }
      },
      plugins: [ChartDataLabels],
    });

    // Cleanup function to destroy chart instance when component unmounts
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data]); // Update dependency to 'data'

  return (
    <div>
      <canvas ref={chartRef} width={600} height={400} />
    </div>
  );
};

export default BarChart;
