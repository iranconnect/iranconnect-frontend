const STEPS = [
  {
    key: "account",
    label: "Account",
    description: "Claim the first SuperAdmin account",
  },
  {
    key: "legal",
    label: "Legal policies",
    description: "Publish the required policies",
  },
  {
    key: "review",
    label: "Review & activate",
    description: "Accept the canonical policies",
  },
];

export default function BootstrapProgress({
  activeStep = "account",
}) {
  const activeIndex = Math.max(
    0,
    STEPS.findIndex(
      (step) => step.key === activeStep
    )
  );

  return (
    <div
      className="
        grid
        grid-cols-1
        gap-3
        md:grid-cols-3
      "
      aria-label="Bootstrap setup progress"
    >
      {STEPS.map((step, index) => {
        const complete =
          index < activeIndex;

        const active =
          index === activeIndex;

        return (
          <div
            key={step.key}
            className="
              rounded-xl
              border
              p-4
              transition-all
              duration-200
            "
            style={{
              borderColor:
                complete || active
                  ? "var(--turquoise)"
                  : "var(--border)",

              background:
                "var(--card-bg)",

              boxShadow: active
                ? "4px 4px 12px var(--shadow-dark), -4px -4px 12px var(--shadow-light)"
                : "none",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  text-sm
                  font-semibold
                "
                style={{
                  background:
                    complete || active
                      ? "var(--turquoise)"
                      : "var(--bg)",

                  color:
                    complete || active
                      ? "var(--navy)"
                      : "var(--text)",

                  border:
                    complete || active
                      ? "none"
                      : "1px solid var(--border)",
                }}
              >
                {complete
                  ? "✓"
                  : index + 1}
              </span>

              <div>
                <p className="text-sm font-semibold">
                  {step.label}
                </p>

                <p className="mt-1 text-xs opacity-65">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
