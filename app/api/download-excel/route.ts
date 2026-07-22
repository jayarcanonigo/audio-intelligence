import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const results = body.results || [];

    if (!results.length) {
      return NextResponse.json(
        { error: "No data received" },
        { status: 400 }
      );
    }


    const worksheet =
      XLSX.utils.json_to_sheet(results);


    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 35 },
      { wch: 80 },
    ];


    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Advertisements"
    );


    const buffer =
      XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });


    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        "Content-Disposition":
          "attachment; filename=advertisement_report.xlsx",
      },
    });


  } catch (error: any) {

    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}