import type { ReactNode } from "react";
import { MapPin, Globe, TrendingUp, Settings2, Star } from "lucide-react";
import {
  SiYoutube,
  SiFacebook,
  SiTiktok,
  SiTelegram,
  SiKakaotalk,
  SiThreads,
  SiNaver,
  SiX,
} from "react-icons/si";

export type Platform = { name: string; icon: ReactNode };

// 브랜드 아이콘이 없는 커머스는 색상 타일 + 짧은 라벨로 대체
function TextTile({ label, bg, color = "#ffffff" }: { label: string; bg: string; color?: string }) {
  return (
    <span
      className="flex h-14 w-14 items-center justify-center rounded-lg text-center text-[13px] font-semibold leading-tight"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}

export const platforms: Platform[] = [
  { name: "국내 서비스", icon: <MapPin size={40} className="text-[#2E82FF]" strokeWidth={1.5} /> },
  { name: "해외 서비스", icon: <Globe size={40} className="text-[#52CC8F]" strokeWidth={1.5} /> },
  { name: "상위노출", icon: <TrendingUp size={40} className="text-[#EF552B]" strokeWidth={1.5} /> },
  { name: "관리서비스", icon: <Settings2 size={40} className="text-[#8B5CF6]" strokeWidth={1.5} /> },
  { name: "유튜브", icon: <SiYoutube size={48} className="text-[#FF0302]" /> },
  { name: "페이스북", icon: <SiFacebook size={48} className="text-[#0866FF]" /> },
  { name: "틱톡", icon: <SiTiktok size={44} className="text-black" /> },
  { name: "텔레그램", icon: <SiTelegram size={48} className="text-[#229ED9]" /> },
  { name: "카카오", icon: <SiKakaotalk size={48} className="text-[#3E1918]" /> },
  { name: "쓰레드", icon: <SiThreads size={46} className="text-black" /> },
  { name: "트위터", icon: <SiX size={42} className="text-black" /> },
  { name: "N포털", icon: <SiNaver size={36} className="text-[#03C75A]" /> },
  { name: "N플레이스", icon: <MapPin size={40} className="text-[#03C75A]" strokeWidth={1.8} /> },
  { name: "N베포", icon: <SiNaver size={36} className="text-[#03C75A]" /> },
  { name: "무신사", icon: <TextTile label="MUSINSA" bg="#000000" /> },
  { name: "쿠팡", icon: <TextTile label="쿠팡" bg="#F7522F" /> },
  { name: "오늘의집", icon: <TextTile label="오늘의집" bg="#35C5F0" /> },
  { name: "올리브영", icon: <TextTile label="OLIVE" bg="#9FCE2D" /> },
  { name: "마켓컬리", icon: <TextTile label="Kurly" bg="#5F0080" /> },
  { name: "배달의 민족", icon: <TextTile label="배민" bg="#2AC1BC" /> },
  { name: "즐겨찾기", icon: <Star size={42} className="fill-[#FFC833] text-[#FFC833]" /> },
];
