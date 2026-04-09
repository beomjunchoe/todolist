export const SUBJECTS = [
  { slug: "korean", name: "국어", description: "문학, 비문학, 수행 정리" },
  { slug: "math", name: "수학", description: "개념, 풀이, 오답 정리" },
  { slug: "english", name: "영어", description: "본문, 단어, 문법 정리" },
  { slug: "science", name: "과학", description: "개념도, 실험, 암기 정리" },
  { slug: "social", name: "사회", description: "핵심 개념, 서술형 정리" },
  { slug: "history", name: "역사", description: "연표, 사건, 흐름 정리" },
  { slug: "ethics", name: "도덕", description: "개념, 사례, 수행 정리" },
  { slug: "free", name: "자유 게시판", description: "자유롭게 공부 자료 공유" },
] as const;

export type SubjectSlug = (typeof SUBJECTS)[number]["slug"];

export function getSubjectBySlug(slug: string) {
  return SUBJECTS.find((subject) => subject.slug === slug) ?? null;
}
