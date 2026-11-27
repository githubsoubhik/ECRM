
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";

export type AttendanceReportRow = {
  employeeId: string;
  name?: string;
  department?: string;
  designation?: string;
  dateKey: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status?: string;
  breakMinutes?: number;
  workMinutes?: number;
};

const columns = [
  "Date",
  "Employee ID",
  "Employee",
  "Department",
  "Check In",
  "Check Out",
  "Status",
  "Break (min)",
  "Worked (min)",
];

const getRows = (data: AttendanceReportRow[]) =>
  data.map((item) => [
    item.dateKey || "",
    item.employeeId || "",
    item.name || "",
    item.department || "",
    item.checkIn
      ? new Date(item.checkIn).toLocaleTimeString("en-IN")
      : "-",
    item.checkOut
      ? new Date(item.checkOut).toLocaleTimeString("en-IN")
      : "-",
    item.status || "-",
    item.breakMinutes ?? 0,
    item.workMinutes ?? 0,
  ]);

const fileName = (period: string) =>
  `Attendance_Report_${period}`;

// PDF EXPORT
export function exportPDF(
  data: AttendanceReportRow[],
  period: string
) {
  const pdf = new jsPDF("landscape");

  pdf.setFontSize(18);
  pdf.text("Attendance Report", 14, 18);

  pdf.setFontSize(10);
  pdf.text(`Period: ${period}`, 14, 26);
  pdf.text(`Total Records: ${data.length}`, 14, 32);

  autoTable(pdf, {
    head: [columns],
    body: getRows(data),
    startY: 38,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    theme: "grid",
  });

  pdf.save(`${fileName(period)}.pdf`);
}

// EXCEL EXPORT
export function exportExcel(
  data: AttendanceReportRow[],
  period: string
) {
  const worksheet = XLSX.utils.aoa_to_sheet([
    columns,
    ...getRows(data),
  ]);

  worksheet["!cols"] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Attendance"
  );

  XLSX.writeFile(
    workbook,
    `${fileName(period)}.xlsx`
  );
}

// WORD EXPORT
export async function exportWord(
  data: AttendanceReportRow[],
  period: string
) {
  const rows = getRows(data);

  const table = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: [
      new TableRow({
        children: columns.map(
          (heading) =>
            new TableCell({
              children: [
                new Paragraph({
                  text: heading,
                }),
              ],
            })
        ),
      }),

      ...rows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (value) =>
                new TableCell({
                  children: [
                    new Paragraph({
                      text: String(value),
                    }),
                  ],
                })
            ),
          })
      ),
    ],
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "Attendance Report",
            heading: HeadingLevel.HEADING_1,
          }),

          new Paragraph(`Period: ${period}`),
          new Paragraph(`Total Records: ${data.length}`),
          table,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);

  saveAs(blob, `${fileName(period)}.docx`);
}