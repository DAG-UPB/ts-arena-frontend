/** How to read the ranking tables, in words that work on a phone, where the column popovers do not. */
export default function RankingLegend() {
  return (
    <>
      Arena Score: higher is better, with its 95 % confidence interval. The rank is a range: a
      model&apos;s place cannot be pinned down more closely than that on the data so far. MASE
      and SQL cover the last 30 days: lower is better.
    </>
  );
}
