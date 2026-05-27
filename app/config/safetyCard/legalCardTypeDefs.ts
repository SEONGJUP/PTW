export type FieldType = "text" | "textarea" | "checkboxItems" | "select";

export interface FormField {
  id: string;
  no: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  hint?: string;
  pdfUrl?: string;
  items?: string[];
  options?: string[];
  required?: boolean;
}

export interface LegalCardTypeDef {
  id: string;
  no: number;
  label: string;
  shortLabel: string;
  icon: string;
  category: string;
  description: string;
  legalBasis: string;
  preSurveyNote?: string;
  preSurveyFields: FormField[];
  planFields: FormField[];
  /** 허용된 장비 키 목록. undefined이면 전체 허용 */
  allowedEquipKeys?: string[];
}

export const LEGAL_CARD_TYPES: LegalCardTypeDef[] = [
  {
    id: "towerCrane",
    no: 1,
    label: "타워크레인을 설치·조립·해체하는 작업",
    shortLabel: "타워크레인 설치·해체",
    icon: "🏗",
    category: "중장비",
    description: "타워크레인의 설치·조립 및 해체 시 작성",
    legalBasis: "산업안전보건기준에 관한 규칙 제38조 제1항 제1호",
    allowedEquipKeys: ["crane", "custom"],
    preSurveyFields: [],
    planFields: [
      { id: "craneTypeForm", no: "가", label: "타워크레인의 종류 및 형식", type: "text", placeholder: "예) 수평지브형, 모델명", required: true },
      { id: "assemblyOrder", no: "나", label: "설치·조립 및 해체순서", type: "textarea", placeholder: "단계별 설치·조립·해체 순서를 기재하세요", required: true },
      { id: "toolsEquipment", no: "다", label: "작업도구·장비·가설설비 및 방호설비", type: "textarea", placeholder: "사용 공구, 장비, 가설설비, 방호설비 목록" },
      { id: "workerRoles", no: "라", label: "작업인원의 구성 및 작업근로자의 역할 범위", type: "textarea", placeholder: "인원 구성표 및 각 역할과 담당 범위" },
      { id: "supportMethod", no: "마", label: "제142조에 따른 지지 방법", type: "textarea", placeholder: "지지방법, 앵커볼트, 벽이음 등 구체적 기재", hint: "산업안전보건기준에 관한 규칙 제142조 참조", pdfUrl: "/docs/article142.pdf" },
    ],
  },
  {
    id: "vehicleHandling",
    no: 2,
    label: "차량계 하역운반기계등을 사용하는 작업",
    shortLabel: "차량계 하역운반기계",
    icon: "🚛",
    category: "차량계",
    description: "지게차·구내운반차·화물자동차 등 하역운반기계 사용 작업 (도로상 주행 제외)",
    legalBasis: "산업안전보건기준에 관한 규칙 제38조 제1항 제2호",
    preSurveyFields: [],
    planFields: [
      {
        id: "hazardPrevention",
        no: "가",
        label: "해당 작업에 따른 위험 예방대책",
        type: "checkboxItems",
        hint: "추락·낙하·전도·협착·붕괴 등 위험별 예방대책 기재",
        items: ["추락 위험 예방대책", "낙하 위험 예방대책", "전도 위험 예방대책", "협착 위험 예방대책", "붕괴 위험 예방대책"],
        required: true,
      },
      { id: "routeMethod", no: "나", label: "차량계 하역운반기계등의 운행경로 및 작업방법", type: "textarea", placeholder: "운행경로 (평면도 첨부 가능), 작업방법, 속도제한, 유도자 배치 등", required: true },
    ],
  },
  {
    id: "constructionMachine",
    no: 3,
    label: "차량계 건설기계를 사용하는 작업",
    shortLabel: "차량계 건설기계",
    icon: "🚧",
    category: "차량계",
    description: "굴착기·불도저·로더 등 차량계 건설기계 사용 작업",
    legalBasis: "산업안전보건기준에 관한 규칙 제38조 제1항 제3호",
    preSurveyNote: "해당 기계의 굴러 떨어짐, 지반의 붕괴 등으로 인한 근로자의 위험을 방지하기 위한 해당 작업장소의 지형 및 지반 상태",
    preSurveyFields: [
      { id: "terrainStatus", no: "가", label: "작업장소의 지형 상태", type: "textarea", placeholder: "지형 현황, 경사도, 단차 등", required: true },
      { id: "groundStatus", no: "나", label: "작업장소의 지반 상태", type: "textarea", placeholder: "지반 종류, 지지력, 연약지반 여부 등", required: true },
      { id: "rollOverRisk", no: "다", label: "기계 굴러 떨어짐 위험 요인", type: "textarea", placeholder: "경사면, 가장자리 등 위험 요인 조사 결과" },
    ],
    planFields: [
      { id: "machineTypePerf", no: "가", label: "사용하는 차량계 건설기계의 종류 및 성능", type: "textarea", placeholder: "기종명, 규격, 허용하중, 작업반경 등", required: true },
      { id: "operatingRoute", no: "나", label: "차량계 건설기계의 운행경로", type: "textarea", placeholder: "운행경로, 회전반경, 대기장소 등", required: true },
      { id: "workMethod", no: "다", label: "차량계 건설기계에 의한 작업방법", type: "textarea", placeholder: "작업방법, 신호체계, 작업반경 내 출입통제 방법" },
    ],
  },
  {
    id: "chemicalFacility",
    no: 4,
    label: "화학설비와 그 부속설비를 사용하는 작업",
    shortLabel: "화학설비 사용",
    icon: "⚗️",
    category: "화학",
    description: "화학설비 및 부속설비의 정비·보수·청소·점검 등 작업",
    legalBasis: "산업안전보건기준에 관한 규칙 제38조 제1항 제4호",
    preSurveyFields: [],
    planFields: [
      { id: "valveOperation", no: "가", label: "밸브·콕 등의 조작", type: "textarea", placeholder: "원재료 공급 또는 제품 취출 시 밸브·콕 조작 절차", hint: "해당 화학설비에 원재료 공급 또는 제품 취출 시에만 해당" },
      { id: "deviceOperation", no: "나", label: "냉각장치·가열장치·교반장치 및 압축장치의 조작", type: "textarea", placeholder: "각 장치의 조작 순서, 설정값, 주의사항" },
      { id: "instrumentMonitor", no: "다", label: "계측장치 및 제어장치의 감시 및 조정", type: "textarea", placeholder: "감시 항목, 정상범위, 이상 시 조치" },
      { id: "safetyDeviceAdj", no: "라", label: "안전밸브·긴급차단장치·방호장치·자동경보장치의 조정", type: "textarea", placeholder: "각 장치 설정값, 작동 확인 방법" },
      { id: "leakCheck", no: "마", label: "덮개판·플랜지·밸브·콕 등의 접합부에서 위험물 등의 누출 여부에 대한 점검", type: "textarea", placeholder: "점검 방법, 주기, 담당자" },
      { id: "sampleCollection", no: "바", label: "시료의 채취", type: "textarea", placeholder: "시료 채취 방법, 위치, 보호구 착용 기준" },
      { id: "shutdownRestart", no: "사", label: "운전 일시 중단 또는 재개 시의 작업방법", type: "textarea", placeholder: "중단·재개 절차, 점검사항, 승인 기준" },
      { id: "emergencyMeasure", no: "아", label: "이상 상태가 발생한 경우의 응급조치", type: "textarea", placeholder: "이상 징후별 응급조치 절차, 대피 기준" },
      { id: "leakResponse", no: "자", label: "위험물 누출 시의 조치", type: "textarea", placeholder: "누출 감지, 차단, 대피, 신고 절차" },
      { id: "fireExplosionPrev", no: "차", label: "그 밖에 폭발·화재를 방지하기 위하여 필요한 조치", type: "textarea", placeholder: "점화원 관리, 방폭 조치, 소화 설비 등" },
    ],
  },
  {
    id: "electrical",
    no: 5,
    label: "제318조에 따른 전기작업",
    shortLabel: "전기작업",
    icon: "⚡",
    category: "전기",
    description: "전압 50V 초과 또는 전기에너지 250VA 초과 전기설비 작업",
    legalBasis: "산업안전보건기준에 관한 규칙 제38조 제1항 제5호",
    preSurveyFields: [],
    planFields: [
      { id: "workPurpose", no: "가", label: "전기작업의 목적 및 내용", type: "textarea", placeholder: "작업 목적, 대상 설비명, 작업 내용 요약", required: true },
      { id: "workerQual", no: "나", label: "전기작업 근로자의 자격 및 적정 인원", type: "textarea", placeholder: "필요 자격(전기기사 등), 투입 인원 및 각 자격 현황", required: true },
      {
        id: "workScope",
        no: "다",
        label: "작업 범위·책임자·전기위험요인·접근한계거리·활선접근경보장치 등 작업시작 전 필요한 사항",
        type: "textarea",
        placeholder: "작업 범위 명시, 작업책임자 지정, 전격·아크섬광·아크폭발 등 위험요인, 접근 한계거리, 활선접근 경보장치 휴대 여부",
        required: true,
      },
      { id: "circuitCutPlan", no: "라", label: "전로 차단에 관한 작업계획 및 전원 재투입 절차 등 작업 상황에 필요한 안전 작업 요령", type: "textarea", placeholder: "제319조에 따른 전로 차단 절차, LOTO, 전원 재투입 순서", hint: "제319조 전로 차단 절차 준수", pdfUrl: "/docs/article319.pdf" },
      { id: "insulationEquip", no: "마", label: "절연용 보호구 및 방호구·활선작업용 기구·장치 등의 준비·점검·착용·사용에 관한 사항", type: "textarea", placeholder: "보호구 목록, 점검 기준, 착용 절차" },
      { id: "testRun", no: "바", label: "점검·시운전을 위한 일시 운전·작업 중단 등에 관한 사항", type: "textarea", placeholder: "시운전 절차, 일시 운전 시 안전 조치, 중단 기준" },
      { id: "shiftHandover", no: "사", label: "교대 근무 시 근무 인계에 관한 사항", type: "textarea", placeholder: "인계 사항, 작업 진행 현황, 미완료 사항 전달 방법" },
      { id: "accessRestriction", no: "아", label: "전기작업장소에 대한 관계 근로자가 아닌 사람의 출입금지에 관한 사항", type: "textarea", placeholder: "출입금지 구역 설정, 표지 설치, 관리 방법" },
      { id: "educationEval", no: "자", label: "전기안전작업계획서를 해당 근로자에게 교육할 수 있는 방법과 작성된 계획서의 평가·관리계획", type: "textarea", placeholder: "교육 방법, 시기, 평가 기준, 계획서 관리 방법" },
      { id: "relatedDocs", no: "차", label: "전기 도면·기기 세부 사항 등 작업과 관련되는 자료", type: "textarea", placeholder: "관련 도면 번호, 기기 사양서, 참고 자료 목록" },
    ],
  },
  {
    id: "excavation",
    no: 6,
    label: "굴착면의 높이가 2미터 이상이 되는 지반의 굴착작업",
    shortLabel: "굴착작업",
    icon: "⛏️",
    category: "토공",
    description: "굴착면 높이 2m 이상인 지반 굴착작업",
    legalBasis: "산업안전보건기준에 관한 규칙 제38조 제1항 제6호",
    preSurveyNote: "지반의 굴착작업에 따른 위험 방지를 위해 사전에 현장 조사 필요",
    preSurveyFields: [
      { id: "terrainGeology", no: "가", label: "형상·지질 및 지층의 상태", type: "textarea", placeholder: "지형 현황, 지질 종류, 지층 구성 (사토·점토·암반 등)", required: true },
      { id: "crackWater", no: "나", label: "균열·함수(含水)·용수 및 동결의 유무 또는 상태", type: "textarea", placeholder: "균열 여부, 지층 내 함수량, 용수 발생 여부, 동절기 동결 상태" },
      { id: "buriedObjects", no: "다", label: "매설물 등의 유무 또는 상태", type: "textarea", placeholder: "상·하수도, 가스관, 전력·통신선 등 매설물 현황" },
      { id: "groundwater", no: "라", label: "지반의 지하수위 상태", type: "textarea", placeholder: "지하수위 깊이, 계절별 변동 가능성" },
    ],
    planFields: [
      { id: "excavMethod", no: "가", label: "굴착방법 및 순서, 토사등 반출 방법", type: "textarea", placeholder: "굴착 공법, 순서, 토사 반출 방법 및 처리 장소", required: true },
      { id: "personnelEquip", no: "나", label: "필요한 인원 및 장비 사용계획", type: "textarea", placeholder: "투입 인원, 사용 장비 목록 및 운용 계획" },
      { id: "buriedProtect", no: "다", label: "매설물 등에 대한 이설·보호대책", type: "textarea", placeholder: "매설물 종류별 이설 또는 방호 조치 방법" },
      { id: "siteComm", no: "라", label: "사업장 내 연락방법 및 신호방법", type: "textarea", placeholder: "무전기, 신호체계, 비상연락망 구성" },
      { id: "retainingWall", no: "마", label: "흙막이 지보공 설치방법 및 계측계획", type: "textarea", placeholder: "흙막이 공법, 지보공 상세, 계측 항목·주기·기준값" },
      { id: "supervisorPlan", no: "바", label: "작업지휘자의 배치계획", type: "textarea", placeholder: "작업지휘자 성명, 자격, 배치 위치, 역할" },
      { id: "otherSafety", no: "사", label: "그 밖에 안전·보건에 관련된 사항", type: "textarea", placeholder: "기타 특이사항 및 추가 안전 조치" },
    ],
  },
  {
    id: "tunnel",
    no: 7,
    label: "터널굴착작업",
    shortLabel: "터널굴착작업",
    icon: "🚇",
    category: "토공",
    description: "터널 굴착·지보·복공 등 터널 관련 전반 작업",
    legalBasis: "산업안전보건기준에 관한 규칙 제38조 제1항 제7호",
    preSurveyNote: "보링(boring) 등 적절한 방법으로 낙반·출수 및 가스폭발 등으로 인한 근로자의 위험을 방지하기 위하여 미리 지형·지질 및 지층상태를 조사",
    preSurveyFields: [
      { id: "geologySurvey", no: "가", label: "지형·지질 및 지층상태 조사 결과", type: "textarea", placeholder: "보링 조사, 시추 결과, 암반 등급, 지하수 현황 등", required: true },
      { id: "gasWaterRisk", no: "나", label: "낙반·출수·가스폭발 등 위험 요인 조사 결과", type: "textarea", placeholder: "예상 위험 구간, 가스 발생 가능성, 출수 예상 구간 등" },
    ],
    planFields: [
      { id: "excavationMethod", no: "가", label: "굴착의 방법", type: "textarea", placeholder: "NATM, TBM, 발파굴착 등 굴착 공법 및 단계별 방법", required: true },
      { id: "supportLining", no: "나", label: "터널지보공 및 복공(覆工)의 시공방법과 용수(湧水)의 처리방법", type: "textarea", placeholder: "락볼트, 숏크리트, 강지보 등 지보공 방법, 라이닝 시공, 용수 배수 처리 계획", required: true },
      { id: "ventilationLight", no: "다", label: "환기 또는 조명시설을 설치할 때에는 그 방법", type: "textarea", placeholder: "환기 방식(압입식·흡출식), 환기량 산정, 조명 기준 및 설치 방법" },
    ],
  },
  {
    id: "bridge",
    no: 8,
    label: "교량(높이 5m 이상 또는 최대 지간 30m 이상)의 설치·해체 또는 변경 작업",
    shortLabel: "교량 설치·해체",
    icon: "🌉",
    category: "구조물",
    description: "상부구조가 금속 또는 콘크리트인 교량으로 높이 5m 이상 또는 최대 지간 30m 이상",
    legalBasis: "산업안전보건기준에 관한 규칙 제38조 제1항 제8호",
    preSurveyFields: [],
    planFields: [
      { id: "methodOrder", no: "가", label: "작업 방법 및 순서", type: "textarea", placeholder: "작업 공정, 단계별 방법 및 순서", required: true },
      { id: "partFallPrev", no: "나", label: "부재(部材)의 낙하·전도 또는 붕괴를 방지하기 위한 방법", type: "textarea", placeholder: "부재 임시 지지, 전도 방지, 붕괴 방지 조치" },
      { id: "workerFallPrev", no: "다", label: "작업에 종사하는 근로자의 추락 위험을 방지하기 위한 안전조치 방법", type: "textarea", placeholder: "안전난간, 안전망, 안전대 부착설비 등" },
      { id: "tempStructure", no: "라", label: "공사에 사용되는 가설 철구조물 등의 설치·사용·해체 시 안전성 검토 방법", type: "textarea", placeholder: "동바리, 가설교량 등 구조 검토 방법, 검토 주체" },
      { id: "machineTypeMethod", no: "마", label: "사용하는 기계 등의 종류 및 성능, 작업방법", type: "textarea", placeholder: "크레인 등 사용 기계 목록, 사양, 인양 계획" },
      { id: "supervisorPlan2", no: "바", label: "작업지휘자 배치계획", type: "textarea", placeholder: "작업지휘자 성명, 자격, 배치 위치" },
      { id: "otherSafety2", no: "사", label: "그 밖에 안전·보건에 관련된 사항", type: "textarea", placeholder: "교통통제, 기상 조건, 비상 대피계획 등" },
    ],
  },
  {
    id: "quarry",
    no: 9,
    label: "채석작업",
    shortLabel: "채석작업",
    icon: "🪨",
    category: "토공",
    description: "채석장에서의 채석 및 관련 작업",
    legalBasis: "산업안전보건기준에 관한 규칙 제38조 제1항 제9호",
    preSurveyNote: "지반의 붕괴·굴착기계의 굴러 떨어짐 등에 의한 근로자에게 발생할 위험을 방지하기 위한 해당 작업장의 지형·지질 및 지층의 상태",
    preSurveyFields: [
      { id: "quarrySurvey", no: "가", label: "작업장의 지형·지질 및 지층의 상태 조사 결과", type: "textarea", placeholder: "지형도, 지질 종류, 암반 등급, 경사면 현황, 붕괴 위험 구간 등", required: true },
    ],
    planFields: [
      { id: "openVsUnderground", no: "가", label: "노천굴착과 갱내굴착의 구별 및 채석방법", type: "textarea", placeholder: "굴착 방식 및 채석 공법", required: true },
      { id: "faceHeightSlope", no: "나", label: "굴착면의 높이와 기울기", type: "text", placeholder: "높이: _m, 기울기: 1: _" },
      { id: "benchPosition", no: "다", label: "굴착면 소단(小段)의 위치와 넓이", type: "textarea", placeholder: "소단 설치 위치(EL), 폭(m), 간격" },
      { id: "undergroundPrev", no: "라", label: "갱내에서의 낙반 및 붕괴방지 방법", type: "textarea", placeholder: "락볼트, 숏크리트, 지보공 등 낙반·붕괴방지 조치" },
      { id: "blastingMethod", no: "마", label: "발파방법", type: "textarea", placeholder: "발파 공법, 장약량, 천공 패턴, 기폭 순서, 대피 기준" },
      { id: "rockSplitMethod", no: "바", label: "암석의 분할방법", type: "textarea", placeholder: "화약, 유압 쐐기, 팽창제 등 분할 방법" },
      { id: "processingPlace", no: "사", label: "암석의 가공장소", type: "text", placeholder: "가공 작업 위치" },
      { id: "machineTypes", no: "아", label: "사용하는 굴착기계·분할기계·적재기계·운반기계의 종류 및 성능", type: "textarea", placeholder: "기종, 모델, 용량, 수량" },
      { id: "transportRoute", no: "자", label: "토석 또는 암석의 적재 및 운반방법과 운반경로", type: "textarea", placeholder: "적재 방법, 운반 차량, 운반 경로, 처리 장소" },
      { id: "topsoilWater", no: "차", label: "표토 또는 용수(湧水)의 처리방법", type: "textarea", placeholder: "표토 제거, 용수 배수 계획" },
    ],
  },
  {
    id: "demolition",
    no: 10,
    label: "구축물·건축물·그 밖의 시설물 등의 해체작업",
    shortLabel: "구축물 해체",
    icon: "🔨",
    category: "해체",
    description: "구축물·건축물·공작물 등 시설물의 해체 작업",
    legalBasis: "산업안전보건기준에 관한 규칙 제38조 제1항 제10호",
    preSurveyNote: "해체건물 등의 구조, 주변 상황 등 사전조사 필요",
    preSurveyFields: [
      { id: "buildingStructure", no: "가", label: "해체 대상 구조물의 구조", type: "textarea", placeholder: "구조 형식(RC·철골·조적 등), 규모(층수·면적), 노후도, 도면 보유 여부", required: true },
      { id: "surroundingSituation", no: "나", label: "주변 상황", type: "textarea", placeholder: "인근 건물·도로·지하매설물·보행자 통행 현황, 이격거리 등" },
    ],
    planFields: [
      { id: "demolitionMethod", no: "가", label: "해체의 방법 및 해체 순서도면", type: "textarea", placeholder: "해체 공법(압쇄·절단·발파 등), 단계별 해체 순서, 도면 첨부 여부", required: true },
      { id: "tempProtectFacility", no: "나", label: "가설설비·방호설비·환기설비 및 살수·방화설비 등의 방법", type: "textarea", placeholder: "방호선반, 낙하물 방지망, 분진 억제 살수, 소화기 배치 등" },
      { id: "siteCommMethod", no: "다", label: "사업장 내 연락방법", type: "textarea", placeholder: "무전기, 신호체계, 비상연락망" },
      { id: "debrisDisposal", no: "라", label: "해체물의 처분계획", type: "textarea", placeholder: "해체 부산물 분리 수거, 처리업체, 반출 방법" },
      { id: "machineWorkPlan", no: "마", label: "해체작업용 기계·기구 등의 작업계획서", type: "textarea", placeholder: "사용 기계(압쇄기·절단기 등) 종류, 사양, 안전조치" },
      { id: "explosivePlan", no: "바", label: "해체작업용 화약류 등의 사용계획서", type: "textarea", placeholder: "발파 해체 시 화약 사용계획, 관할 허가 사항 (해당 없으면 '해당 없음' 기재)" },
      { id: "otherSafety3", no: "사", label: "그 밖에 안전·보건에 관련된 사항", type: "textarea", placeholder: "석면 함유 여부, 출입통제, 분진 관리 등" },
    ],
  },
  {
    id: "heavyLoad",
    no: 11,
    label: "중량물의 취급작업",
    shortLabel: "중량물 취급",
    icon: "🏋️",
    category: "중량물",
    description: "중량물의 인양·운반·거치 등 취급 작업",
    legalBasis: "산업안전보건기준에 관한 규칙 제38조 제1항 제11호",
    preSurveyFields: [],
    planFields: [
      { id: "fallPrevMeasure", no: "가", label: "추락위험을 예방할 수 있는 안전대책", type: "textarea", placeholder: "안전대 착용, 작업발판, 안전난간 등 추락방지 조치", required: true },
      { id: "dropPrevMeasure", no: "나", label: "낙하위험을 예방할 수 있는 안전대책", type: "textarea", placeholder: "줄걸이 점검, 인양물 하부 출입통제, 안전구역 설정 등" },
      { id: "overturnPrevMeasure", no: "다", label: "전도위험을 예방할 수 있는 안전대책", type: "textarea", placeholder: "하중 중심 확인, 지반 지지력 확인, 아웃리거 설치 등" },
      { id: "trappingPrevMeasure", no: "라", label: "협착위험을 예방할 수 있는 안전대책", type: "textarea", placeholder: "신호수 배치, 작업반경 통제, 끼임 위험 요소 제거 등" },
      { id: "collapsePrevMeasure", no: "마", label: "붕괴위험을 예방할 수 있는 안전대책", type: "textarea", placeholder: "적재 방법, 적재 높이 제한, 지반 보강 등" },
    ],
  },
  {
    id: "railTrack",
    no: 12,
    label: "궤도나 그 밖의 관련 설비의 보수·점검작업",
    shortLabel: "궤도 보수·점검",
    icon: "🚃",
    category: "궤도",
    description: "철도·궤도 및 관련 설비의 보수·점검 작업",
    legalBasis: "산업안전보건기준에 관한 규칙 제38조 제1항 제12호",
    preSurveyFields: [],
    planFields: [
      { id: "suitablePersonnel", no: "가", label: "적절한 작업 인원", type: "textarea", placeholder: "투입 인원 수, 자격, 역할 배치", required: true },
      { id: "workVolume", no: "나", label: "작업량", type: "textarea", placeholder: "보수·점검 구간, 작업 범위, 물량" },
      { id: "workOrder", no: "다", label: "작업순서", type: "textarea", placeholder: "단계별 작업 순서 및 절차" },
      { id: "methodAndSafety", no: "라", label: "작업방법 및 위험요인에 대한 안전조치방법 등", type: "textarea", placeholder: "작업 방법, 열차 감시 방법, 선로 차단 절차, 위험요인별 안전조치" },
    ],
  },
  {
    id: "trainShunting",
    no: 13,
    label: "열차의 교환·연결 또는 분리 작업(입환작업)",
    shortLabel: "열차 입환작업",
    icon: "🚂",
    category: "궤도",
    description: "열차 차량의 교환·연결·분리 작업",
    legalBasis: "산업안전보건기준에 관한 규칙 제38조 제1항 제13호",
    preSurveyFields: [],
    planFields: [
      { id: "suitablePersonnel2", no: "가", label: "적절한 작업 인원", type: "textarea", placeholder: "투입 인원 수, 자격, 역할 배치", required: true },
      { id: "workVolume2", no: "나", label: "작업량", type: "textarea", placeholder: "교환·연결·분리 대상 차량 수, 작업 범위" },
      { id: "workOrder2", no: "다", label: "작업순서", type: "textarea", placeholder: "단계별 입환 작업 순서 및 절차" },
      { id: "methodAndSafety2", no: "라", label: "작업방법 및 위험요인에 대한 안전조치방법 등", type: "textarea", placeholder: "입환 방법, 신호체계, 열차 충돌·협착·추락 등 위험요인별 안전조치" },
    ],
  },
];
