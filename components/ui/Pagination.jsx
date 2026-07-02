// frontend/components/ui/Pagination.jsx

function buildPageItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  const items = [1];

  if (currentPage > 4) {
    items.push("left-ellipsis");
  }

  const start = Math.max(
    2,
    currentPage - 1
  );

  const end = Math.min(
    totalPages - 1,
    currentPage + 1
  );

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (currentPage < totalPages - 3) {
    items.push("right-ellipsis");
  }

  items.push(totalPages);

  return items;
}

export default function Pagination({
  pagination,
  onPageChange,
  disabled = false,
}) {
  if (
    !pagination ||
    pagination.totalPages <= 1
  ) {
    return null;
  }

  const {
    page,
    totalPages,
    total,
    from,
    to,
    hasPreviousPage,
    hasNextPage,
  } = pagination;

  const pageItems = buildPageItems(
    page,
    totalPages
  );

  function changePage(nextPage) {
    if (
      disabled ||
      nextPage < 1 ||
      nextPage > totalPages ||
      nextPage === page
    ) {
      return;
    }

    onPageChange(nextPage);
  }

  const baseButtonClass =
    "min-w-9 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t pt-5 sm:flex-row">
      <p className="text-sm text-[var(--text)] opacity-70">
        Showing {from}–{to} of {total}
      </p>

      <nav
        className="flex flex-wrap items-center justify-center gap-2"
        aria-label="Pagination"
      >
        <button
          type="button"
          disabled={!hasPreviousPage || disabled}
          onClick={() => changePage(page - 1)}
          className={baseButtonClass}
          style={{
            borderColor: "var(--border)",
            color: "var(--text)",
            background: "var(--card-bg)",
          }}
        >
          Previous
        </button>

        {pageItems.map((item) => {
          if (
            item === "left-ellipsis" ||
            item === "right-ellipsis"
          ) {
            return (
              <span
                key={item}
                className="px-1 text-sm text-[var(--text)] opacity-60"
              >
                …
              </span>
            );
          }

          const isActive = item === page;

          return (
            <button
              key={item}
              type="button"
              disabled={disabled}
              onClick={() => changePage(item)}
              aria-current={
                isActive
                  ? "page"
                  : undefined
              }
              className={baseButtonClass}
              style={{
                borderColor: isActive
                  ? "var(--turquoise)"
                  : "var(--border)",

                background: isActive
                  ? "var(--turquoise)"
                  : "var(--card-bg)",

                color: isActive
                  ? "var(--navy)"
                  : "var(--text)",
              }}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          disabled={!hasNextPage || disabled}
          onClick={() => changePage(page + 1)}
          className={baseButtonClass}
          style={{
            borderColor: "var(--border)",
            color: "var(--text)",
            background: "var(--card-bg)",
          }}
        >
          Next
        </button>
      </nav>
    </div>
  );
}
