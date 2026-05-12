/** 견적 목록 · 단가표 등 리스트형 화면 공통 레이아웃 (포맷 통일) */
export const listPageMainClass =
  "mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-4 p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:gap-5 sm:p-6 sm:pb-[calc(6rem+env(safe-area-inset-bottom))]";

export const listPageTitleRowClass = "flex min-w-0 items-center gap-3";

export const listPageH1Class =
  "shrink-0 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl";

/** 제목 오른쪽 영역 공통 셸(검색 input · 건수 등) */
export const listPageTitleAsideShell =
  "ml-auto h-10 min-h-10 min-w-0 max-w-[12rem] flex-1 rounded-lg border border-input bg-background px-3 sm:max-w-xs";

export const listFilterNavClass = "flex flex-wrap gap-2";

export const listFilterChipClass =
  "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors sm:px-3.5 sm:py-2 sm:text-base";
