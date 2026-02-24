"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface Region {
  id: string;
  code: string;
  name: string;
}

interface RegionFilterProps {
  regions: Region[];
  selectedRegions: string[];
  coverageAll: boolean;
}

export default function RegionFilter({
  regions,
  selectedRegions,
  coverageAll,
}: RegionFilterProps) {
  const [coverageAllChecked, setCoverageAllChecked] = useState(coverageAll);
  const [selected, setSelected] = useState<string[]>(selectedRegions);

  useEffect(() => {
    setCoverageAllChecked(coverageAll);
  }, [coverageAll]);

  useEffect(() => {
    setSelected(selectedRegions);
  }, [selectedRegions]);

  const isFiltered = useMemo(
    () => coverageAllChecked || selected.length > 0,
    [coverageAllChecked, selected]
  );

  const updateFilterStatus = useCallback(
    (isCoverageAll: boolean, selectedCount: number) => {
      const filterStatus = document.getElementById("filter-status");
      if (!filterStatus) return;
      if (!isCoverageAll && selectedCount === 0) {
        filterStatus.classList.add("hidden");
        return;
      }
      filterStatus.classList.remove("hidden");
      filterStatus.textContent = `Filtrando por: ${
        isCoverageAll ? "Todo Chile" : `${selectedCount} regiones seleccionadas`
      }`;
    },
    []
  );

  const applyFilter = useCallback(
    (nextCoverageAll: boolean, nextSelected: string[]) => {
      const cards = document.querySelectorAll(
        '[data-executive-card="true"]'
      ) as NodeListOf<HTMLElement>;

      cards.forEach((card) => {
        const cardCoverageAll = card.dataset.coverageAll === "true";
        const regionsRaw = (card.dataset.coverageRegions || "")
          .split(",")
          .filter(Boolean);

        let visible = true;
        if (nextCoverageAll) {
          visible = cardCoverageAll;
        } else if (nextSelected.length > 0) {
          visible =
            cardCoverageAll ||
            regionsRaw.some((code) => nextSelected.includes(code));
        }

        if (visible) {
          card.classList.remove("hidden");
        } else {
          card.classList.add("hidden");
        }
      });

      updateFilterStatus(nextCoverageAll, nextSelected.length);
    },
    [updateFilterStatus]
  );

  const syncUrl = useCallback(
    (nextCoverageAll: boolean, nextSelected: string[]) => {
      const url = new URL(window.location.href);
      url.searchParams.delete("coverage");
      url.searchParams.delete("region");

      if (nextCoverageAll) {
        url.searchParams.set("coverage", "all");
      } else {
        nextSelected.forEach((code) => {
          url.searchParams.append("region", code);
        });
      }

      window.history.replaceState({}, "", url);
    },
    []
  );

  const handleCoverageAllChange = () => {
    const nextCoverageAll = !coverageAllChecked;
    const nextSelected = nextCoverageAll ? [] : selected;
    setCoverageAllChecked(nextCoverageAll);
    setSelected(nextSelected);
    applyFilter(nextCoverageAll, nextSelected);
    syncUrl(nextCoverageAll, nextSelected);
  };

  const handleRegionToggle = (code: string) => {
    const isChecked = selected.includes(code);
    const nextSelected = isChecked
      ? selected.filter((item) => item !== code)
      : [...selected, code];
    const nextCoverageAll = false;

    setCoverageAllChecked(false);
    setSelected(nextSelected);
    applyFilter(nextCoverageAll, nextSelected);
    syncUrl(nextCoverageAll, nextSelected);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilter(coverageAllChecked, selected);
    syncUrl(coverageAllChecked, selected);
  };

  const handleClear = () => {
    setCoverageAllChecked(false);
    setSelected([]);
    applyFilter(false, []);
    syncUrl(false, []);
  };

  useEffect(() => {
    applyFilter(coverageAllChecked, selected);
  }, [applyFilter, coverageAllChecked, selected]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">Ubicación</h3>
        <button
          type="button"
          onClick={handleClear}
          className={`text-xs text-emerald-600 hover:text-emerald-500 font-medium ${
            !isFiltered ? "hidden" : ""
          }`}
        >
          Limpiar filtros
        </button>
      </div>

      <form id="region-filter-form" method="get" className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="group relative flex cursor-pointer items-center p-3 rounded-lg border border-gray-200 hover:bg-slate-50 transition-all has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:ring-1 has-[:checked]:ring-emerald-500">
            <div className="flex h-5 items-center">
              <input
                id="coverage-all"
                name="coverage"
                value="all"
                type="checkbox"
                checked={coverageAllChecked}
                onChange={handleCoverageAllChange}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
              />
            </div>
            <div className="ml-3">
              <span className="block text-sm font-medium text-slate-900 group-hover:text-emerald-700">
                Todo Chile
              </span>
              <span className="block text-xs text-slate-500">
                Ver cobertura nacional
              </span>
            </div>
          </label>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Selecciona Regiones
          </p>
          <div className="flex flex-wrap gap-2">
            {regions.map((region) => {
              const isChecked = selected.includes(region.code);
              return (
                <label key={region.id} className="cursor-pointer group">
                  <input
                    type="checkbox"
                    name="region"
                    value={region.code}
                    checked={isChecked}
                    onChange={() => handleRegionToggle(region.code)}
                    className="peer sr-only region-checkbox"
                  />
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 transition-all group-hover:bg-slate-200 peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:ring-emerald-600">
                    {region.name}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-colors"
          >
            Aplicar Filtros
          </button>
        </div>
      </form>
    </div>
  );
}
