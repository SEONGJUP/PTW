"use client";
import { useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  Image,
  Font,
} from "@react-pdf/renderer";
import type { WorkPlanState } from "@/store/workPlanStore";

// ─── 스타일 ────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    color: "#1e293b",
  },
  header: {
    borderBottomWidth: 3,
    borderBottomColor: "#00B7AF",
    marginBottom: 16,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#00B7AF" },
  headerSub: { fontSize: 9, color: "#64748b" },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#00B7AF",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 4,
    marginBottom: 8,
    marginTop: 14,
  },
  row: { flexDirection: "row", marginBottom: 5 },
  label: { width: 100, color: "#64748b", fontSize: 9 },
  value: { flex: 1, fontSize: 10 },
  table: { marginTop: 6 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#00B7AF",
    padding: 4,
  },
  tableHeaderCell: {
    flex: 1,
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    padding: 4,
  },
  tableCell: { flex: 1, fontSize: 8, color: "#374151" },
  signatureBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
    padding: 10,
    width: 150,
    alignItems: "center",
    marginRight: 10,
  },
  signatureLabel: { fontSize: 8, color: "#64748b", marginBottom: 4 },
  signatureImage: { width: 120, height: 50, objectFit: "contain" },
  signatureName: { fontSize: 9, marginTop: 4, fontFamily: "Helvetica-Bold" },
  signatureDate: { fontSize: 7, color: "#94a3b8", marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: "#94a3b8" },
  badge: {
    backgroundColor: "#e6faf9",
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
  },
  badgeText: { fontSize: 7, color: "#00A099" },
});

// ─── PDF 문서 컴포넌트 ─────────────────────────────────────────────
function WorkPlanPDF({
  state,
  generatedAt,
}: {
  state: Pick<WorkPlanState, "documentProfile" | "planCategory" | "sections" | "formData" | "signatures" | "attachments">;
  generatedAt: string;
}) {
  const { sections, formData, signatures, documentProfile, planCategory } = state;
  const enabledSections = sections.filter((s) => s.enabled);

  const overview = (formData["overview"] as Record<string, string> | undefined) ?? {};
  const docTitle = overview.title ?? "작업계획서";

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* 헤더 */}
        <View style={S.header}>
          <View>
            <Text style={S.headerTitle}>{docTitle}</Text>
            <Text style={S.headerSub}>
              {documentProfile === "lite" ? "약식 " : "정식 "}작업계획서 · SafeBuddy
            </Text>
          </View>
          <Text style={S.headerSub}>{generatedAt}</Text>
        </View>

        {/* 각 섹션 */}
        {enabledSections.map((sec) => {
          const data = (formData[sec.id] as Record<string, unknown> | undefined) ?? {};

          if (sec.id === "overview") {
            return (
              <View key={sec.id}>
                <Text style={S.sectionTitle}>1. 작업 개요</Text>
                {[
                  ["작업명", "title"],
                  ["작업 목적", "purpose"],
                  ["작업 배경", "background"],
                  ["작업 위치", "location"],
                  ["작업 기간", "period"],
                ].map(([label, key]) =>
                  data[key] ? (
                    <View key={key} style={S.row}>
                      <Text style={S.label}>{label}</Text>
                      <Text style={S.value}>{String(data[key])}</Text>
                    </View>
                  ) : null
                )}
              </View>
            );
          }

          if (sec.id === "schedule") {
            const rows = (data.rows as Array<Record<string, string>> | undefined) ?? [];
            if (rows.length === 0) return null;
            return (
              <View key={sec.id}>
                <Text style={S.sectionTitle}>{sec.label}</Text>
                <View style={S.table}>
                  <View style={S.tableHeader}>
                    {["작업 내용", "시작일", "종료일", "담당자"].map((h) => (
                      <Text key={h} style={S.tableHeaderCell}>{h}</Text>
                    ))}
                  </View>
                  {rows.map((r, i) => (
                    <View key={i} style={[S.tableRow, i % 2 === 1 ? { backgroundColor: "#f8fafc" } : {}]}>
                      <Text style={S.tableCell}>{r.task ?? ""}</Text>
                      <Text style={S.tableCell}>{r.start ?? ""}</Text>
                      <Text style={S.tableCell}>{r.end ?? ""}</Text>
                      <Text style={S.tableCell}>{r.responsible ?? ""}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          }

          if (sec.id === "risk") {
            const rows = (data.rows as Array<Record<string, string>> | undefined) ?? [];
            if (rows.length === 0) return null;
            return (
              <View key={sec.id}>
                <Text style={S.sectionTitle}>{sec.label}</Text>
                <View style={S.table}>
                  <View style={S.tableHeader}>
                    {["위험 요소", "심각도", "대응 방안"].map((h) => (
                      <Text key={h} style={S.tableHeaderCell}>{h}</Text>
                    ))}
                  </View>
                  {rows.map((r, i) => (
                    <View key={i} style={[S.tableRow, i % 2 === 1 ? { backgroundColor: "#f8fafc" } : {}]}>
                      <Text style={S.tableCell}>{r.risk ?? ""}</Text>
                      <Text style={S.tableCell}>{r.severity ?? ""}</Text>
                      <Text style={S.tableCell}>{r.mitigation ?? ""}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          }

          if (sec.id === "signature") {
            return null; // 서명은 아래에서 별도 처리
          }

          // 그 외 섹션: 텍스트 요약
          const textContent = Object.entries(data)
            .filter(([, v]) => typeof v === "string" && v)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n");

          if (!textContent) return null;

          return (
            <View key={sec.id}>
              <Text style={S.sectionTitle}>{sec.label}</Text>
              <Text style={{ fontSize: 9, color: "#374151", lineHeight: 1.5 }}>{textContent}</Text>
            </View>
          );
        })}

        {/* 서명란 */}
        {signatures.some((s) => s.status === "done") && (
          <View>
            <Text style={S.sectionTitle}>서명 및 결재</Text>
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              {signatures.map((sig) => (
                <View key={sig.role} style={S.signatureBox}>
                  <Text style={S.signatureLabel}>{sig.role}</Text>
                  {sig.dataUrl ? (
                    <Image src={sig.dataUrl} style={S.signatureImage} />
                  ) : (
                    <View style={{ width: 120, height: 50, backgroundColor: "#f8fafc" }} />
                  )}
                  <Text style={S.signatureName}>{sig.name || "-"}</Text>
                  <Text style={S.signatureDate}>
                    {sig.signedAt ? new Date(sig.signedAt).toLocaleDateString("ko-KR") : "미서명"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 푸터 */}
        <View style={S.footer}>
          <Text style={S.footerText}>SafeBuddy · PTW 작업계획서 시스템</Text>
          <Text style={S.footerText}>{generatedAt} 출력</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── 내보내기 버튼 컴포넌트 ───────────────────────────────────────
interface PdfExportProps {
  state: Pick<WorkPlanState, "documentProfile" | "planCategory" | "sections" | "formData" | "signatures" | "attachments">;
}

export default function PdfExport({ state }: PdfExportProps) {
  const [ready, setReady] = useState(false);
  const generatedAt = new Date().toLocaleString("ko-KR");
  const overview = (state.formData["overview"] as Record<string, string> | undefined) ?? {};
  const fileName = `작업계획서_${overview.title ?? "미입력"}_${new Date().toISOString().slice(0, 10)}.pdf`;

  if (!ready) {
    return (
      <button
        onClick={() => setReady(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
        style={{ backgroundColor: "#00B7AF" }}
      >
        🖨 PDF 내보내기
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={<WorkPlanPDF state={state} generatedAt={generatedAt} />}
      fileName={fileName}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
      style={{ backgroundColor: "#00A099", textDecoration: "none" }}
    >
      {({ loading }) => (loading ? "⏳ 생성 중..." : "⬇ PDF 다운로드")}
    </PDFDownloadLink>
  );
}
