import "server-only";
import { getSettingsMap } from "./settings";

/**
 * 사이트 문구 레지스트리 — 유저 페이지의 안내/마케팅 문구를 어드민에서 관리한다.
 *
 * 모든 키는 Setting 테이블에 `copy_` 접두사로 저장되고, 값이 비어 있으면
 * 아래 default(현재 하드코딩돼 있던 원문)가 그대로 쓰인다.
 * {siteName} 플레이스홀더는 렌더 시 사이트명으로 치환된다.
 */

export type CopyItem = {
  key: string; // copy_ 접두사 제외한 짧은 키
  label: string;
  default: string;
  textarea?: boolean; // 줄바꿈 있는 문단
  hint?: string;
};

export type CopySection = { title: string; page: string; items: CopyItem[] };

export const COPY_SECTIONS: CopySection[] = [
  {
    title: "메인 — 상단 히어로",
    page: "/",
    items: [
      { key: "hero_eyebrow", label: "히어로 윗줄", default: "인스타그램 좋아요 늘리기로 비즈니스를 성장하세요!" },
      { key: "hero_title_suffix", label: "환영 타이틀 (사이트명 뒤)", default: "에 오신것을 환영합니다!", hint: "사이트명 + 이 문구로 표시됩니다." },
      { key: "hero_card1_caption", label: "배너1(서비스 안내) 설명", default: "우리의 서비스를 더 쉽고 편리하게 활용하는 방법" },
      { key: "hero_card1_title", label: "배너1 제목", default: "서비스 안내" },
      { key: "hero_card2_caption", label: "배너2(1:1 문의) 설명", default: "무엇을 도와드릴까요? 편하게 남겨주세요" },
      { key: "hero_card2_title", label: "배너2 제목", default: "1:1 문의" },
      { key: "hero_card3_caption", label: "배너3(고객센터) 설명", default: "자주 묻는 질문부터 상담까지 한눈에" },
      { key: "hero_card3_title", label: "배너3 제목", default: "고객센터" },
      { key: "hero_card1_href", label: "배너1 링크", default: "/guide", hint: "내부 경로(/guide) 또는 전체 URL" },
      { key: "hero_card2_href", label: "배너2 링크", default: "/inquiry", hint: "내부 경로 또는 전체 URL" },
      { key: "hero_card3_href", label: "배너3 링크", default: "/support", hint: "내부 경로 또는 전체 URL" },
      { key: "hero_card1_color", label: "배너1 배경색", default: "#EF552B", hint: "#RRGGBB 형식" },
      { key: "hero_card2_color", label: "배너2 배경색", default: "#FFC833", hint: "#RRGGBB 형식" },
      { key: "hero_card3_color", label: "배너3 배경색", default: "#52CC8F", hint: "#RRGGBB 형식" },
    ],
  },
  {
    title: "메인 — 주문하기 섹션",
    page: "/",
    items: [
      { key: "order_title", label: "섹션 제목", default: "주문하기" },
      { key: "order_desc", label: "섹션 설명", default: "한국인 인스타 팔로워 구매, 인스타그램 좋아요 늘리기 비즈니스 성장을 시작하세요" },
      { key: "order_guide_link", label: "우측 가이드 링크 문구", default: "신규 가이드 제작하기" },
      { key: "order_notice", label: "안내 박스", textarea: true, default: "회원가입 이후 SNS서포터에서 24시간 언제든 원하는 마케팅 상품을 간편하게 주문하세요.\n인스타그램 팔로워 늘리기부터 유튜브, 페이스북까지 다양한 플랫폼의 맞춤형 마케팅 서비스를 제공하고 있습니다." },
      { key: "ticker_empty", label: "티커 기본 문구 (주문 없을 때)", default: "지금 바로 첫 주문을 시작해보세요!" },
      { key: "step01_title", label: "STEP01 제목", default: "이용하실 SNS 플랫폼을 선택해 주세요." },
      { key: "step02_title", label: "STEP02 제목", default: "사용하실 서비스 목록을 선택해 주세요." },
      { key: "step03_title", label: "STEP03 제목", default: "해당 상품에 대한 상세 설명 입니다." },
      { key: "step04_title", label: "STEP04 제목", default: "주문 링크를 입력해주세요." },
      { key: "step05_title", label: "STEP05 제목", default: "구매 수량을 입력해주세요." },
      { key: "step06_title", label: "STEP06 제목", default: "주문금액" },
      { key: "order_footnote", label: "주문 버튼 아래 문구", default: "주문 시 보유잔액에서 즉시 차감됩니다." },
      { key: "inquiry_only_title", label: "문의전용 플랫폼 안내 제목", default: "{플랫폼} 서비스는 별도 문의로 진행됩니다", hint: "{플랫폼}이 선택한 플랫폼명으로 치환됩니다. 상품이 없는 플랫폼 선택 시 표시." },
      { key: "inquiry_only_desc", label: "문의전용 플랫폼 안내 본문", textarea: true, default: "해당 플랫폼은 계정·상품 상황에 따라 맞춤 견적으로 안내드리고 있습니다.\n1:1 문의를 남겨주시면 확인 후 빠르게 답변드리겠습니다." },
      { key: "category1", label: "STEP02 필터1 라벨", default: "일반" },
      { key: "category2", label: "STEP02 필터2 라벨 (팔로워류)", default: "팔로워", hint: "라벨만 바뀌고 필터 동작은 유지됩니다." },
      { key: "category3", label: "STEP02 필터3 라벨 (연령/성별류)", default: "연령별 / 성별", hint: "라벨만 바뀌고 필터 동작은 유지됩니다." },
      { key: "dtab1", label: "상세 탭1 라벨", default: "서비스 설명" },
      { key: "dtab2", label: "상세 탭2 라벨", default: "주문 방법" },
      { key: "dtab3", label: "상세 탭3 라벨", default: "주의 사항" },
      { key: "dtab4", label: "상세 탭4 라벨", default: "FAQ" },
    ],
  },
  {
    title: "메인 — STEP03 상세 탭",
    page: "/",
    items: [
      { key: "detail_service_desc", label: "[서비스 설명] 기본 문구", textarea: true, default: "회원가입 이후 24시간 언제든 원하는 마케팅 상품을 간편하게 주문하세요. 인스타그램 팔로워 늘리기부터 유튜브, 틱톡까지 다양한 플랫폼의 맞춤형 마케팅 서비스를 제공하고 있습니다." },
      { key: "detail_link_guide", label: "[주문 방법] 링크 기입방법", textarea: true, default: "• 인스타그램 게시물 링크를 입력해주세요.\n게시글 우측 상단 [메뉴] 클릭 → 링크복사 → 주문링크에 붙여넣은 후 주문\n[링크형식 : https://www.instagram.com/p/xxxxxxxx]" },
      { key: "detail_order_steps", label: "[주문 방법] 주문 순서", textarea: true, default: "1. 플랫폼 선택 → 서비스 선택\n2. 주문 링크·수량 입력\n3. 주문금액 확인 후 [주문하기] — 보유잔액에서 즉시 차감됩니다.\n4. 주문내역에서 진행 상태를 확인하세요." },
      { key: "detail_start_time", label: "[주문 방법] 주문 시작시간", default: "평균 5~20분내로 자동으로 작업이 시작됩니다." },
      { key: "detail_caution", label: "[주의 사항] 본문", textarea: true, default: "• 비공개 계정은 작업이 불가능합니다. 주문 전 공개 상태로 전환해주세요.\n• 작업 중 계정·게시물을 삭제하거나 비공개로 전환하면 처리가 불가하며 환불되지 않습니다.\n• 동일 링크는 이전 주문이 완료된 후 재주문해주세요. 중복 주문 시 누락될 수 있습니다.\n• 링크를 잘못 입력해 진행된 주문은 취소·환불이 어렵습니다." },
      { key: "detail_faq1_q", label: "[FAQ] 질문 1", default: "Q. 주문 후 언제 시작되나요?" },
      { key: "detail_faq1_a", label: "[FAQ] 답변 1", textarea: true, default: "평균 5~20분 내 자동으로 시작되며, 서비스에 따라 최대 몇 시간이 걸릴 수 있습니다." },
      { key: "detail_faq2_q", label: "[FAQ] 질문 2", default: "Q. 주문을 취소할 수 있나요?" },
      { key: "detail_faq2_a", label: "[FAQ] 답변 2", textarea: true, default: "작업 시작 전이라면 1:1 문의로 요청해주세요. 관리자가 환불 처리하면 결제 금액이 잔액으로 복구됩니다." },
      { key: "detail_faq3_q", label: "[FAQ] 질문 3", default: "Q. 수량이 다 안 들어오면 어떻게 되나요?" },
      { key: "detail_faq3_a", label: "[FAQ] 답변 3", textarea: true, default: "미완료 수량은 확인 후 잔액으로 환불 처리해드립니다. 1:1 문의로 남겨주세요." },
    ],
  },
  {
    title: "서비스 안내",
    page: "/guide",
    items: [
      { key: "guide_eyebrow", label: "머리말", default: "이용 방법과 서비스 효과 안내" },
      { key: "guide_title", label: "페이지 제목", default: "서비스 안내 및 주문 방법" },
      { key: "guide_card1_desc", label: "서비스 카드1 설명 (템플릿)", textarea: true, hint: "치환자: {플랫폼} {팔로워} {좋아요} {피드} — 탭별 용어로 자동 치환", default: "한국인 실사용자 {팔로워}가 자연스럽게 늘어납니다. 성별·연령 타겟팅은 물론, 90일간 A/S 리필까지 확실히 보장합니다." },
      { key: "guide_card2_desc", label: "서비스 카드2 설명 (템플릿)", textarea: true, hint: "치환자: {플랫폼} {팔로워} {좋아요} {피드} — 탭별 용어로 자동 치환", default: "게시물 노출과 도달률을 한 번에! 부담 없는 가격으로 시작하는 {좋아요} 서비스와 편리한 자동 옵션까지 만나보세요." },
      { key: "guide_card3_desc", label: "서비스 카드3 설명 (템플릿)", textarea: true, hint: "치환자: {플랫폼} {팔로워} {좋아요} {피드} — 탭별 용어로 자동 치환", default: "인기 게시물 상위 노출로 검색 최상단을 점유하세요. {좋아요}, 도달, 인사이트를 종합 부스팅하여 자연 유입을 극대화합니다." },
      { key: "guide_effect1_desc", label: "상품효과1 설명 (템플릿)", textarea: true, hint: "치환자: {플랫폼} {팔로워} {좋아요} {피드} — 탭별 용어로 자동 치환", default: "{플랫폼} {팔로워} 구매는 계정의 첫인상을 결정합니다. {팔로워} 수가 많은 계정은 신규 방문자에게 신뢰감을 주고, {플랫폼} 알고리즘이 콘텐츠를 더 넓은 범위에 노출시키는 계기가 됩니다." },
      { key: "guide_effect2_desc", label: "상품효과2 설명 (템플릿)", textarea: true, hint: "치환자: {플랫폼} {팔로워} {좋아요} {피드} — 탭별 용어로 자동 치환", default: "{좋아요}는 게시물의 품질 신호입니다. {좋아요}가 많은 게시물은 알고리즘에 의해 더 많은 사용자의 {피드}에 노출되어 자연 도달률이 크게 향상됩니다." },
      { key: "guide_effect3_desc", label: "상품효과3 설명 (템플릿)", textarea: true, hint: "치환자: {플랫폼} {팔로워} {좋아요} {피드} — 탭별 용어로 자동 치환", default: "{팔로워}와 {좋아요}의 시너지 효과로 {플랫폼} 계정이 종합적으로 성장합니다. 브랜드 인지도, 매출, 협업 기회까지 비즈니스 전반의 성과를 끌어올릴 수 있습니다." },
      { key: "guide_faq1_q", label: "FAQ 질문 1", default: "주문 후 작업은 언제 시작되나요?" },
      { key: "guide_faq1_a", label: "FAQ 답변 1", textarea: true, default: "결제(입금) 확인 후 평균 5~20분 내로 자동으로 작업이 시작됩니다." },
      { key: "guide_faq2_q", label: "FAQ 질문 2", default: "비공개 계정도 가능한가요?" },
      { key: "guide_faq2_a", label: "FAQ 답변 2", textarea: true, default: "비공개 계정은 작업이 불가능합니다. 작업 시작 전 공개 계정으로 전환해 주세요." },
      { key: "guide_faq3_q", label: "FAQ 질문 3", default: "팔로워가 빠지면 어떻게 하나요?" },
      { key: "guide_faq3_a", label: "FAQ 답변 3", textarea: true, default: "90일간 A/S 리필을 보장합니다. 감소분이 발생하면 고객센터로 문의해 주세요." },
      { key: "guide_faq4_q", label: "FAQ 질문 4", default: "주문을 취소할 수 있나요?" },
      { key: "guide_faq4_a", label: "FAQ 답변 4", textarea: true, default: "작업이 시작되기 전이라면 취소가 가능합니다. 시작 이후에는 취소가 어렵습니다." },
      { key: "guide_faq5_q", label: "FAQ 질문 5", default: "세금계산서 발행이 되나요?" },
      { key: "guide_faq5_a", label: "FAQ 답변 5", textarea: true, default: "사업자 회원은 세금계산서 발행이 가능합니다. 1:1 문의로 사업자 정보를 남겨주세요." },
    ],
  },
  {
    title: "잔액충전",
    page: "/charge",
    items: [
      { key: "charge_eyebrow", label: "머리말", default: "무통장입금으로 간편하게 잔액 충전" },
      { key: "charge_title", label: "페이지 제목", default: "잔액충전" },
      { key: "charge_depositor_note", label: "입금자명 안내", textarea: true, default: "입금자명이 다를 경우 자동충전이 안됩니다.\n5글자 이상 예금주명도 정상반영 처리 됩니다." },
      { key: "charge_notice", label: "안내사항 (줄당 1항목)", textarea: true, default: "충전 신청 후 입금을 진행해야 합니다. 신청 시 계좌번호를 확인할 수 있습니다.\n현금영수증 및 세금계산서는 영업일 24시간 내 자동 발행됩니다.\n입금자명이 신청과 다르면 자동 반영되지 않을 수 있습니다." },
    ],
  },
  {
    title: "게시판/기타 페이지 머리말",
    page: "여러 페이지",
    items: [
      { key: "notice_eyebrow", label: "공지사항 머리말", default: "주요 서비스 소식 및 안내 확인" },
      { key: "inquiry_eyebrow", label: "1:1 문의 머리말", default: "담당자에게 직접 질문하기" },
      { key: "blog_eyebrow", label: "블로그 머리말", default: "SNS 마케팅의 모든 것을 알려드립니다." },
      { key: "orders_eyebrow", label: "주문내역 머리말", default: "주문 · 환불 내역 확인" },
      { key: "findid_eyebrow", label: "아이디 찾기 머리말", default: "계정 찾기" },
    ],
  },
  {
    title: "고객센터",
    page: "/support",
    items: [
      { key: "support_eyebrow", label: "머리말", default: "여기서 먼저 답을 찾아보세요." },
      { key: "support_title", label: "페이지 제목", default: "궁금하신게 있으신가요?" },
      { key: "support_kakao_desc", label: "카카오톡 카드 설명", default: "실시간 채팅으로 가장 빠르게 답변받을 수 있는 채널입니다." },
      { key: "support_phone_desc", label: "전화 카드 설명", default: "통화로 자세한 상담을 원하시면 아래 번호로 연락 주세요." },
      { key: "support_proposal_desc", label: "제안서 카드 설명", default: "서비스 구성과 가격이 정리된 제안서를 확인해 보세요." },
      { key: "support_portfolio_desc", label: "포트폴리오 카드 설명", default: "그동안 진행한 마케팅 성과와 사례를 모아두었습니다." },
    ],
  },
  {
    title: "회사소개",
    page: "/about",
    items: [
      { key: "about_eyebrow", label: "머리말", default: "SNS 마케팅 파트너" },
      { key: "about_title", label: "페이지 제목", default: "회사 소개" },
      { key: "about_heading_suffix", label: "소개 헤딩 (사이트명 뒤)", default: "는 SNS 마케팅의 모든 것을 제공합니다" },
      { key: "about_values_title", label: "핵심가치 섹션 제목", default: "우리가 일하는 방식" },
      { key: "about_ops_title", label: "운영 안내 제목", default: "운영 안내" },
      { key: "about_value1_title", label: "핵심가치1 제목", default: "빠른 처리" },
      { key: "about_value1_desc", label: "핵심가치1 설명", textarea: true, default: "주문 후 평균 5~20분 내 자동으로 작업이 시작됩니다. 24시간 언제든 주문할 수 있습니다." },
      { key: "about_value2_title", label: "핵심가치2 제목", default: "실사용자 품질" },
      { key: "about_value2_desc", label: "핵심가치2 설명", textarea: true, default: "실제 활동하는 사용자 기반으로 자연스럽게 반영되어 계정 성장에 도움이 됩니다." },
      { key: "about_value3_title", label: "핵심가치3 제목", default: "안심 운영" },
      { key: "about_value3_desc", label: "핵심가치3 설명", textarea: true, default: "무통장입금 수동 확인과 A/S 리필 정책으로 안전하게 이용할 수 있습니다." },
      { key: "about_ops", label: "운영 안내 본문", textarea: true, default: "문의는 1:1 문의 게시판과 고객센터 채널을 통해 접수됩니다. 충전 입금 확인은 관리자가 순차적으로 처리하며, 완료 시 알림으로 안내드립니다." },
    ],
  },
  {
    title: "로그인 · 회원가입",
    page: "/login /signup",
    items: [
      { key: "login_title", label: "로그인 제목", default: "로그인을 해주세요" },
      { key: "login_subtitle", label: "로그인 부제", default: "인스타그램 좋아요 늘리기로 비즈니스를 성장하세요!" },
      { key: "signup1_title", label: "가입 1단계 제목", textarea: true, default: "서비스 이용약관에\n동의해주세요" },
      { key: "signup1_subtitle", label: "가입 1단계 부제", default: "원활한 서비스 이용을 위해 약관 동의가 필요합니다." },
      { key: "signup2_title", label: "가입 2단계 제목", textarea: true, default: "계정 정보를\n입력해주세요" },
      { key: "signup2_subtitle", label: "가입 2단계 부제", default: "서비스 이용에 필요한 기본 정보입니다." },
      { key: "signup3_title", label: "가입 3단계 제목", textarea: true, default: "추가 정보를\n알려 주세요" },
      { key: "signup3_subtitle", label: "가입 3단계 부제", default: "서비스 이용에 필요한 기본 정보입니다." },
      { key: "signup4_title", label: "가입 완료 제목", default: "가입이 완료되었어요" },
      { key: "signup4_subtitle", label: "가입 완료 부제 (사이트명 뒤)", default: "이제 SignalSMM의 모든 서비스를 이용할 수 있습니다." },
      { key: "signup4_welcome", label: "가입 완료 환영 문구", default: "환영합니다! 잔액을 충전하고 첫 주문을 시작해보세요." },
      { key: "signup4_button", label: "가입 완료 버튼", default: "시작하기" },
    ],
  },
  {
    title: "푸터",
    page: "전체",
    items: [
      { key: "footer_copyright", label: "카피라이트 (치환자 {year} {siteName})", default: "© {year} {siteName}. All rights reserved." },
    ],
  },
];

export const COPY_KEYS = new Set(
  COPY_SECTIONS.flatMap((s) => s.items.map((i) => `copy_${i.key}`)),
);

const DEFAULTS: Record<string, string> = Object.fromEntries(
  COPY_SECTIONS.flatMap((s) => s.items.map((i) => [i.key, i.default])),
);

export type Copy = Record<string, string>;

/** 저장된 문구 + 기본값 병합. 키는 접두사 없는 짧은 키.
 *  Setting 통읽기(getSettingsMap, 요청당 캐시)에서 copy_ 접두 키만 분리한다. */
export async function getCopy(): Promise<Copy> {
  const map = await getSettingsMap();
  const saved: Copy = {};
  for (const [k, v] of Object.entries(map)) {
    if (k.startsWith("copy_") && v.trim() !== "") saved[k.slice("copy_".length)] = v;
  }
  return { ...DEFAULTS, ...saved };
}
