interface WithReasonProps {
  reason: string;
  className?: string;
  children: React.ReactNode;
}

/** Text with its reason as a tooltip and as hidden text, so screen readers get it too. */
export default function WithReason({ reason, className, children }: WithReasonProps) {
  return (
    <span className={className} title={reason}>
      {children}
      <span className="sr-only">. {reason}</span>
    </span>
  );
}
