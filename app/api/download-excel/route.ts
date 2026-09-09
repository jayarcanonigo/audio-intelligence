import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const results = body.results || [];

    if (!results.length) {
      return NextResponse.json(
        {
          error: "No data received",
        },
        {
          status: 400,
        }
      );
    }

    // Convert all string values to uppercase
    const upperCaseResults = results.map(
      (row: Record<string, any>) => {
        const upperCaseRow: Record<string, any> = {};

        Object.entries(row).forEach(([key, value]) => {
          if (typeof value === "string") {
            upperCaseRow[key] = value.toUpperCase();
          } else {
            upperCaseRow[key] = value;
          }
        });

        return upperCaseRow;
      }
    );

    // Create worksheet
    const worksheet =
      XLSX.utils.json_to_sheet(upperCaseResults);

    // Set column widths
    worksheet["!cols"] = [
      {
        wch: 18,
      },
      {
        wch: 18,
      },
      {
        wch: 18,
      },
      {
        wch: 35,
      },
      {
        wch: 80,
      },
    ];

    // Create workbook
    const workbook =
      XLSX.utils.book_new();

    // Add worksheet
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Advertisements"
    );

    // Generate XLSX buffer
    const buffer =
      XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

    // Return Excel file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

        "Content-Disposition":
          "attachment; filename=advertisement_report.xlsx",
      },
    });
  } catch (error: any) {
    console.error(
      "Excel export error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to generate Excel report",
      },
      {
        status: 500,
      }
    );
  }
}