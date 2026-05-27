import type { SafetyCardDocument, ValidationResult, ValidationIssue } from "@/types/safetyCardTypes";
import { legalWorkPlanTypes, riskWorkAttributes, sectionConfigs } from "@/config/safetyCard";

export function validateSafetyCard(doc: SafetyCardDocument): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Common field validation
  if (!doc.common.title?.trim()) {
    issues.push({ field: "common.title", section: "overview", severity: "error", message: "문서 제목을 입력하세요." });
  }
  if (!doc.common.documentDate) {
    issues.push({ field: "common.documentDate", section: "overview", severity: "error", message: "작업일자를 입력하세요." });
  }
  if (!doc.common.location?.trim()) {
    issues.push({ field: "common.location", section: "overview", severity: "error", message: "작업 장소를 입력하세요." });
  }
  if (!doc.common.writer?.trim()) {
    issues.push({ field: "common.writer", section: "overview", severity: "error", message: "작성자를 입력하세요." });
  }

  // Work type validation
  if (doc.selectedLegalWorkPlanTypes.length === 0 && doc.selectedRiskAttributes.length === 0 && doc.selectedEquipmentTypes.length === 0) {
    issues.push({ field: "workTypes", section: "overview", severity: "warning", message: "법정작업 유형, 위험특성, 사용장비 중 하나 이상을 선택하는 것을 권장합니다." });
  }

  // Legal work plan type required role checks
  doc.selectedLegalWorkPlanTypes.forEach((typeId) => {
    const config = legalWorkPlanTypes.find((t) => t.id === typeId);
    if (!config) return;

    config.requiredRoles.forEach((role) => {
      const hasRole = doc.workers.some((w) => w.role === role);
      if (!hasRole) {
        issues.push({
          field: "workers",
          section: "workers",
          severity: "warning",
          message: `[${config.label}] 작업에는 '${role}' 역할의 작업자가 필요합니다.`,
        });
      }
    });
  });

  // Risk attribute checks
  doc.selectedRiskAttributes.forEach((attrId) => {
    const config = riskWorkAttributes.find((a) => a.id === attrId);
    if (!config) return;

    const enabledSections = new Set(doc.enabledSections);
    config.sections.forEach((sectionId) => {
      if (!enabledSections.has(sectionId)) {
        issues.push({
          field: sectionId,
          section: sectionId,
          severity: "warning",
          message: `[${config.label}] 속성으로 인해 '${sectionConfigs.find((s) => s.id === sectionId)?.label ?? sectionId}' 섹션 활성화를 권장합니다.`,
        });
      }
    });
  });

  // Detailed tasks validation
  if (doc.detailedTasks.length === 0) {
    issues.push({ field: "detailedTasks", section: "detailedTasks", severity: "warning", message: "세부 작업 항목을 1개 이상 입력하세요." });
  }

  // Risk assessment check
  if (doc.enabledSections.includes("riskAssessment") && doc.riskAssessments.length === 0) {
    issues.push({ field: "riskAssessments", section: "riskAssessment", severity: "warning", message: "위험성평가 항목을 입력하세요." });
  }

  // Safety inspection check
  if (doc.enabledSections.includes("safetyInspection") && doc.safetyInspections.length === 0) {
    issues.push({ field: "safetyInspections", section: "safetyInspection", severity: "warning", message: "안전점검 항목을 입력하세요." });
  }

  // Approval check
  const hasApprovals = doc.approvals.length > 0;
  if (!hasApprovals) {
    issues.push({ field: "approvals", section: "approvals", severity: "error", message: "결재선을 설정하세요." });
  }

  // Heavy load check
  if (doc.selectedLegalWorkPlanTypes.includes("heavyLoad")) {
    if (!doc.heavyLoad.loadName?.trim()) {
      issues.push({ field: "heavyLoad.loadName", section: "heavyLoad", severity: "error", message: "[중량물 취급] 중량물명을 입력하세요." });
    }
    if (!doc.heavyLoad.loadWeight) {
      issues.push({ field: "heavyLoad.loadWeight", section: "heavyLoad", severity: "error", message: "[중량물 취급] 중량물 중량을 입력하세요." });
    }
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return {
    isValid: errors.length === 0,
    issues,
    errorCount: errors.length,
    warningCount: warnings.length,
  };
}

export function canTransitionTo(doc: SafetyCardDocument, targetStatus: SafetyCardDocument["status"]): { allowed: boolean; reason?: string } {
  const { status } = doc;

  const transitions: Record<string, string[]> = {
    draft: ["completed"],
    completed: ["draft", "approvalRequested"],
    approvalRequested: ["inReview", "draft"],
    inReview: ["revisionRequested", "approved", "rejected"],
    revisionRequested: ["draft"],
    approved: ["posted"],
    posted: [],
    rejected: ["draft"],
  };

  const allowed = transitions[status]?.includes(targetStatus) ?? false;
  if (!allowed) {
    return { allowed: false, reason: `${status} → ${targetStatus} 전환은 허용되지 않습니다.` };
  }

  if (targetStatus === "completed" || targetStatus === "approvalRequested") {
    const result = validateSafetyCard(doc);
    if (!result.isValid) {
      return { allowed: false, reason: `필수 입력항목 ${result.errorCount}건을 먼저 완료하세요.` };
    }
  }

  return { allowed: true };
}

export function getStatusLabel(status: SafetyCardDocument["status"]): string {
  const labels: Record<string, string> = {
    draft: "작성중",
    completed: "작성완료",
    approvalRequested: "결재요청",
    inReview: "결재중",
    revisionRequested: "반려(보완요청)",
    approved: "결재완료",
    posted: "게시됨",
    rejected: "반려",
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: SafetyCardDocument["status"]): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    completed: "bg-blue-100 text-blue-700",
    approvalRequested: "bg-yellow-100 text-yellow-700",
    inReview: "bg-orange-100 text-orange-700",
    revisionRequested: "bg-red-100 text-red-700",
    approved: "bg-green-100 text-green-700",
    posted: "bg-teal-100 text-teal-700",
    rejected: "bg-red-100 text-red-700",
  };
  return colors[status] ?? "bg-gray-100 text-gray-600";
}
