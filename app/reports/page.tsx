"use client";

import {
  FileText,
  Download,
  Calendar,
  Clock,
  Headphones,
} from "lucide-react";


const reports = [
  {
    id: 1,
    name: "Morning Radio Analysis",
    date: "2026-07-22",
    duration: "02:30:45",
    segments: 124,
    status: "Completed",
  },
  {
    id: 2,
    name: "Advertisement Detection",
    date: "2026-07-21",
    duration: "01:45:20",
    segments: 86,
    status: "Completed",
  },
];


export default function ReportsPage() {

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-3xl font-bold">
            📑 Reports
          </h1>

          <p className="text-gray-500 mt-1">
            View audio analysis reports and export results
          </p>
        </div>


        <button
          className="
          flex items-center gap-2
          bg-blue-600 text-white
          px-4 py-2 rounded-lg
          hover:bg-blue-700
          "
        >
          <Download size={18}/>
          Export
        </button>

      </div>



      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">


        <Card
          icon={<FileText />}
          title="Total Reports"
          value="24"
        />


        <Card
          icon={<Headphones />}
          title="Audio Processed"
          value="86 hrs"
        />


        <Card
          icon={<Clock />}
          title="Segments Found"
          value="2,540"
        />


        <Card
          icon={<Calendar />}
          title="This Month"
          value="12"
        />


      </div>



      {/* Reports Table */}
      <div className="
        bg-white
        rounded-xl
        shadow
        border
        overflow-hidden
      ">


        <table className="w-full">

          <thead className="bg-gray-100">

            <tr>
              <th className="p-4 text-left">
                Report
              </th>

              <th className="p-4 text-left">
                Date
              </th>

              <th className="p-4 text-left">
                Duration
              </th>

              <th className="p-4 text-left">
                Segments
              </th>

              <th className="p-4 text-left">
                Status
              </th>

              <th className="p-4">
                Action
              </th>

            </tr>

          </thead>


          <tbody>

          {reports.map((report)=> (

            <tr
              key={report.id}
              className="
              border-t
              hover:bg-gray-50
              "
            >

              <td className="p-4 font-medium">
                {report.name}
              </td>


              <td className="p-4">
                {report.date}
              </td>


              <td className="p-4">
                {report.duration}
              </td>


              <td className="p-4">
                {report.segments}
              </td>


              <td className="p-4">

                <span
                className="
                px-3 py-1
                rounded-full
                text-sm
                bg-green-100
                text-green-700
                "
                >
                  {report.status}
                </span>

              </td>


              <td className="p-4">

                <button
                className="
                text-blue-600
                hover:underline
                "
                >
                  View
                </button>

              </td>


            </tr>

          ))}

          </tbody>

        </table>


      </div>

    </div>
  );
}



function Card({
  icon,
  title,
  value,
}:{
  icon:React.ReactNode;
  title:string;
  value:string;
}){

  return (

    <div
    className="
    bg-white
    border
    rounded-xl
    p-5
    shadow-sm
    flex
    gap-4
    items-center
    "
    >

      <div
      className="
      p-3
      bg-gray-100
      rounded-lg
      "
      >
        {icon}
      </div>


      <div>

        <p className="text-gray-500 text-sm">
          {title}
        </p>

        <h2 className="text-2xl font-bold">
          {value}
        </h2>

      </div>

    </div>

  );
}