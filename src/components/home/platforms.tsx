// 플랫폼 아이콘: 기본/호버 이미지 (public/platforms). 라벨은 기본 아이콘 파일명 기준.
export type Platform = { name: string; def: string; hover: string };

const base = "/platforms";

export const platforms: Platform[] = [
  { name: "국내서비스", def: `${base}/국내서비스.png`, hover: `${base}/국내서비스_호버.png` },
  { name: "해외서비스", def: `${base}/해외서비스.png`, hover: `${base}/해외서비스_호버.png` },
  { name: "상위노출", def: `${base}/상위노출.png`, hover: `${base}/상위노출_호버.png` },
  { name: "관리서비스", def: `${base}/관리서비스.png`, hover: `${base}/관리서비스_호버.png` },
  { name: "유튜브", def: `${base}/유튜브.png`, hover: `${base}/유튜브_호버.png` },
  { name: "페이스북", def: `${base}/페이스북.png`, hover: `${base}/페이스북_호버.png` },
  { name: "틱톡", def: `${base}/틱톡.png`, hover: `${base}/틱톡_호버.png` },
  { name: "텔레그램", def: `${base}/텔레그램.png`, hover: `${base}/텔레그램_호버.png` },
  { name: "카카오", def: `${base}/카카오.png`, hover: `${base}/카카오톡_호버.png` },
  { name: "쓰레드", def: `${base}/쓰레드.png`, hover: `${base}/쓰레드_호버.png` },
  { name: "X트위터", def: `${base}/X트위터.png`, hover: `${base}/X트위터_호버.png` },
  { name: "네이버", def: `${base}/네이버.png`, hover: `${base}/네이버_호버.png` },
  { name: "네이버플레이스", def: `${base}/네이버플레이스.png`, hover: `${base}/네이버플레이스_호버.png` },
  { name: "네이버블로그", def: `${base}/네이버블로그.png`, hover: `${base}/네이버블로그_호버.png` },
  { name: "무신사", def: `${base}/무신사.png`, hover: `${base}/무신사_호버.png` },
  { name: "쿠팡", def: `${base}/쿠팡.png`, hover: `${base}/쿠팡_호버.png` },
  { name: "오늘의집", def: `${base}/오늘의집.png`, hover: `${base}/오늘의집_호버.png` },
  { name: "올리브영", def: `${base}/올리브영.png`, hover: `${base}/올리브영_호버.png` },
  { name: "마켓컬리", def: `${base}/마켓컬리.png`, hover: `${base}/마켓컬리_호버.png` },
  { name: "배달의민족", def: `${base}/배달의민족.png`, hover: `${base}/배달의민족_호버.png` },
  { name: "즐겨찾기", def: `${base}/즐겨찾기.png`, hover: `${base}/즐겨찾기_호버.png` },
];
