// frontend/hooks/usePaginationQuery.js

import { useMemo } from "react";
import { useRouter } from "next/router";

function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function readQueryValue(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return typeof value === "string"
    ? value
    : "";
}

export default function usePaginationQuery({
  filterKeys = [],
  defaultLimit = 10,
} = {}) {
  const router = useRouter();

  const page = readPositiveInteger(
    router.query.page,
    1
  );

  const limit = readPositiveInteger(
    router.query.limit,
    defaultLimit
  );

  const filters = useMemo(() => {
    const result = {};

    for (const key of filterKeys) {
      result[key] = readQueryValue(
        router.query[key]
      );
    }

    return result;
  }, [
    router.query,
    filterKeys,
  ]);

  function replaceQuery(nextQuery) {
    router.replace(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      {
        shallow: true,
        scroll: false,
      }
    );
  }

  function setPage(nextPage) {
    replaceQuery({
      ...router.query,
      page: String(nextPage),
      limit: String(limit),
    });
  }

  function applyFilters(nextFilters = {}) {
    const query = {
      page: "1",
      limit: String(limit),
    };

    for (const key of filterKeys) {
      const value = String(
        nextFilters[key] || ""
      ).trim();

      if (value) {
        query[key] = value;
      }
    }

    replaceQuery(query);
  }

  function clearFilters() {
    replaceQuery({
      page: "1",
      limit: String(limit),
    });
  }

  return {
    isReady: router.isReady,

    page,
    limit,
    filters,

    setPage,
    applyFilters,
    clearFilters,
  };
}
