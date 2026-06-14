import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  try {
    const { results } = await req.json();

    console.log("Received results for Excel export:", results);

    // ✅ SAFE mapping (matches your frontend)
    const formatted = (results || []).map((r: any) => ({
      Text: r.Text || "",
      Start: r.Start || "",
      End: r.End || "",
    }));

    // ❗ fallback safety check
    if (!formatted.length) {
      return NextResponse.json(
        { error: "No data to export" },
        { status: 400 }
      );
    }

    const worksheet = XLSX.utils.json_to_sheet(formatted);

    // optional: column width (nice formatting)
    worksheet["!cols"] = [
      { wch: 60 }, // Text
      { wch: 15 }, // Start
      { wch: 15 }, // End
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Segments");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          "attachment; filename=radio_segments.xlsx",
      },
    });
  } catch (err: any) {
    console.error("Excel export error:", err);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}