import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileSpreadsheet, BarChart3, AlertCircle, LoaderCircle } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type CsvRow = Record<string, string>;

export default function CsvVisualizer() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseCsv(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      parseCsv(file);
    }
  };

  const parseCsv = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only .csv files are supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Please upload a file smaller than 5MB.");
      return;
    }

    setError(null);
    setIsParsing(true);
    setFileName(file.name);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows = (results.data as CsvRow[]).filter((row) => Object.values(row).some((value) => value !== ""));
        const parsedHeaders = results.meta.fields && results.meta.fields.length > 0 ? results.meta.fields : Object.keys(parsedRows[0] ?? {});

        setRows(parsedRows);
        setHeaders(parsedHeaders);
        setIsParsing(false);
      },
      error: (parseError) => {
        setError(parseError.message);
        setRows([]);
        setHeaders([]);
        setIsParsing(false);
      },
    });
  };

  const numericColumns = useMemo(() => {
    return headers.filter((header) =>
      rows.length > 0 &&
      rows.every((row) => {
        const value = row[header];
        if (value === undefined || value === null || value === "") {
          return true;
        }
        const normalized = Number(String(value).replace(/,/g, ""));
        return !Number.isNaN(normalized);
      })
    );
  }, [headers, rows]);

  const numericSummary = useMemo(() => {
    return numericColumns.map((column) => {
      const values = rows
        .map((row) => Number(String(row[column]).replace(/,/g, "")))
        .filter((value) => Number.isFinite(value));

      if (values.length === 0) {
        return null;
      }

      const total = values.reduce((sum, value) => sum + value, 0);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const average = total / values.length;

      return {
        column,
        min,
        max,
        total,
        average,
        count: values.length,
      };
    }).filter(Boolean) as {
      column: string;
      min: number;
      max: number;
      total: number;
      average: number;
      count: number;
    }[];
  }, [numericColumns, rows]);

  const chartConfig = useMemo(() => {
    if (rows.length === 0 || numericColumns.length === 0) {
      return null;
    }

    const firstNumeric = numericColumns[0];
    const labelColumn = headers.find((header) => !numericColumns.includes(header)) ?? headers[0];

    const data = rows.slice(0, 15).map((row, index) => ({
      label: row[labelColumn] || `Row ${index + 1}`,
      value: Number(String(row[firstNumeric]).replace(/,/g, "")) || 0,
    }));

    return {
      metricName: firstNumeric,
      labelName: labelColumn,
      data,
    };
  }, [headers, numericColumns, rows]);

  const resetData = () => {
    setRows([]);
    setHeaders([]);
    setFileName(null);
    setError(null);
    setIsParsing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CSV Visualizer</h1>
        <p className="text-sm text-muted-foreground">
          Drag & drop a CSV file to explore and visualize its data instantly.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
          <CardDescription>Supports UTF-8 CSV files up to 5MB.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-2xl p-10 text-center transition-colors bg-muted/40",
              isDragging ? "border-primary bg-primary/10" : "border-border"
            )}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                {isParsing ? <LoaderCircle className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
              </div>
              <div>
                <p className="text-base font-semibold">Drop your CSV here</p>
                <p className="text-sm text-muted-foreground">or click the button below to browse</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => inputRef.current?.click()}
                  data-testid="button-browse-csv"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Browse files
                </Button>
                {rows.length > 0 && (
                  <Button type="button" variant="ghost" onClick={resetData} data-testid="button-reset-csv">
                    Reset
                  </Button>
                )}
              </div>
              {fileName && (
                <Badge variant="secondary" className="text-sm font-normal px-3 py-1.5">
                  Loaded: {fileName}
                </Badge>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Unable to read file</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>{rows.length} rows • {headers.length} columns</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-lg border bg-card">
                <ScrollArea className="w-full max-h-[480px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background shadow-sm z-10">
                      <TableRow>
                        {headers.map((header) => (
                          <TableHead key={header} className="font-semibold min-w-[160px]">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, rowIndex) => (
                        <TableRow key={`row-${rowIndex}`}>
                          {headers.map((header) => (
                            <TableCell key={`${rowIndex}-${header}`} className="text-sm text-muted-foreground">
                              {row[header] ?? ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                  Quick Metrics
                </CardTitle>
                <CardDescription>
                  Summary for numeric columns detected automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {numericSummary.length > 0 ? (
                  numericSummary.map((summary) => (
                    <div key={summary.column} className="p-3 rounded-lg border bg-muted/40 space-y-1">
                      <p className="text-sm font-semibold">{summary.column}</p>
                      <div className="text-xs text-muted-foreground">
                        {summary.count} values • Min {summary.min.toLocaleString()} • Max {summary.max.toLocaleString()}
                      </div>
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>Total</span>
                        <span className="font-mono">{summary.total.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-medium">
                        <span>Average</span>
                        <span className="font-mono">{summary.average.toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No numeric columns detected in this dataset.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sample Visualization</CardTitle>
                <CardDescription>
                  {chartConfig ? `${chartConfig.metricName} grouped by ${chartConfig.labelName}` : "Add a numeric column to view a chart."}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                {chartConfig ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartConfig.data}>
                      <XAxis dataKey="label" hide={chartConfig.data.length > 10} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0ea5e9" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center">
                    We need at least one numeric column to render a chart. Upload a different CSV or include numeric data.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

