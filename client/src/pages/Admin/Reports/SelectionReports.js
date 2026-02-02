import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Download,
  Search,
  Map,
  Layout,
  ClipboardList,
  Percent,
  CheckCircle,
  ChevronLeft,
} from "lucide-react";
import styles from "./SelectionReports.module.css";
import Breadcrumbs from "../../../components/Breadcrumbs/Breadcrumbs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
);

const API_URL = process.env.REACT_APP_BACKEND_API_URL;

const whiteBackgroundPlugin = {
  id: "custom_canvas_background_color",
  beforeDraw: (chart) => {
    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
};

const SelectionReports = () => {
  const navigate = useNavigate();
  const chartRefs = useRef({});
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [reportType, setReportType] = useState("district");
  const [activeCategory, setActiveCategory] = useState("NMMS");
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const currentPath = useMemo(
    () => ["Admin", "Academics", "Reports", "Selection Reports"],
    [],
  );

  const graphHeadingMap = {
    NMMS: "Number of students appeared for NMMS",
    TURNOUT: "PP-Test appeared students as a percentage of called students",
    SELECTION:
      "PP selected students as a percentage of PP-Test appeared students",
    SELECTS: "Gender-wise selected students ",
  };

  useEffect(() => {
    let isMounted = true;
    axios
      .get(`${API_URL}/api/selection-reports/init`)
      .then((res) => {
        if (isMounted) {
          const yearList = Array.isArray(res.data.years) ? res.data.years : [];
          setYears(yearList);
          if (yearList.length > 0) setSelectedYear(yearList[0].academic_year);
        }
      })
      .catch((err) => console.error("Init Error:", err));
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const endpointMap = {
        NMMS: "nmms-data",
        TURNOUT: "turnout-data",
        SELECTION: "selection-data",
        SELECTS: "selects-data",
      };
      const res = await axios.get(
        `${API_URL}/api/selection-reports/${endpointMap[activeCategory]}`,
        {
          params: { year: selectedYear, type: reportType },
        },
      );
      setData(res.data || []);
    } catch (err) {
      console.error("Fetch Error:", err.response?.data || err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, reportType, activeCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const groupedData = useMemo(() => {
    const filtered = data.filter(
      (item) =>
        item.label?.toLowerCase().includes(search.toLowerCase()) ||
        item.district_name?.toLowerCase().includes(search.toLowerCase()) ||
        item.block_name?.toLowerCase().includes(search.toLowerCase()),
    );

    let processedData = filtered;
    if (activeCategory === "SELECTS") {
      const groupedByLabel = filtered.reduce((acc, curr) => {
        if (!acc[curr.label]) {
          acc[curr.label] = {
            label: curr.label,
            district_name: curr.district_name,
            boys_sel: 0,
            girls_sel: 0,
          };
        }
        // FIX: Mapping to student_count from new query
        if (curr.gender === "M") {
          acc[curr.label].boys_sel = Number(curr.student_count || 0);
        } else if (curr.gender === "F") {
          acc[curr.label].girls_sel = Number(curr.student_count || 0);
        }
        return acc;
      }, {});
      processedData = Object.values(groupedByLabel);
    }

    if (reportType === "district")
      return { [graphHeadingMap[activeCategory]]: processedData };

    return processedData.reduce((acc, item) => {
      const group = item.district_name || "Unknown District";
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {});
  }, [data, search, reportType, activeCategory]);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const reportPayload = Object.keys(groupedData).map((groupName) => {
        const chart = chartRefs.current[groupName];
        return {
          districtName: groupName,
          chartImage: chart ? chart.toBase64Image("image/jpeg", 0.6) : null,
          blocks: groupedData[groupName],
        };
      });

      const downloadMap = {
        NMMS: "download-pdf",
        TURNOUT: "download-turnout-pdf",
        SELECTION: "download-selection-pdf",
        SELECTS: "download-selects-pdf",
      };

      const response = await axios.post(
        `${API_URL}/api/selection-reports/${downloadMap[activeCategory]}`,
        {
          year: selectedYear,
          type: reportType,
          reportPayload: reportPayload,
        },
        { responseType: "blob" },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `NMMS_${activeCategory}_${selectedYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Breadcrumbs
        path={currentPath}
        nonLinkSegments={["Admin", "Academics"]}
      />

      <header className={styles.mainHeader}>
        <div className={styles.titleWrapper}>
          <button
            className={styles.iconBtn}
            onClick={() => navigate("/admin/academics/reports")}
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className={styles.title}>Analytics Dashboard</h1>
        </div>
        <button
          className={styles.downloadBtn}
          onClick={handleDownload}
          disabled={loading}
        >
          {loading ? (
            "Generating..."
          ) : (
            <>
              <Download size={18} /> Download Report
            </>
          )}
        </button>
      </header>

      <div className={styles.reportNav}>
        <button
          className={activeCategory === "NMMS" ? styles.navActive : ""}
          onClick={() => setActiveCategory("NMMS")}
        >
          <ClipboardList size={18} /> NMMS Report
        </button>
        <button
          className={activeCategory === "TURNOUT" ? styles.navActive : ""}
          onClick={() => setActiveCategory("TURNOUT")}
        >
          <Percent size={18} /> Test Turn-Out Report
        </button>
        <button
          className={activeCategory === "SELECTION" ? styles.navActive : ""}
          onClick={() => setActiveCategory("SELECTION")}
        >
          <CheckCircle size={18} /> Selection Report
        </button>
        <button
          className={activeCategory === "SELECTS" ? styles.navActive : ""}
          onClick={() => setActiveCategory("SELECTS")}
        >
          <CheckCircle size={18} /> Gender-wise Report
        </button>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.yearSelectorGroup}>
          <label className={styles.yearLabel}>Select Academic Year</label>
          <select
            className={styles.bigSelect}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {years.map((y) => (
              <option key={y.academic_year} value={y.academic_year}>
                {y.academic_year}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.toggleGroup}>
          <button
            className={reportType === "district" ? styles.active : ""}
            onClick={() => setReportType("district")}
          >
            <Map size={16} /> District View
          </button>
          <button
            className={reportType === "block" ? styles.active : ""}
            onClick={() => setReportType("block")}
          >
            <Layout size={16} /> Block View
          </button>
        </div>

        <div className={styles.searchWrapperExpanded}>
          <Search size={18} color="#64748b" />
          <input
            placeholder="Search by District or Block Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loader}>Syncing with server...</div>
      ) : (
        <>
          {reportType === "block" && (
            <div className={styles.topHeaderWrapper}>
              <h2 className={styles.mainGraphTitle}>
                {graphHeadingMap[activeCategory]}
              </h2>
            </div>
          )}

          <div
            className={
              reportType === "block"
                ? styles.twoColumnGrid
                : styles.singleColumn
            }
          >
            {Object.keys(groupedData).map((groupName) => {
              const groupItems = groupedData[groupName];

              const totalA = groupItems.reduce((acc, curr) => {
                if (activeCategory === "SELECTS")
                  return acc + curr.boys_sel + curr.girls_sel;
                return (
                  acc +
                  Number(
                    activeCategory === "TURNOUT"
                      ? curr.appeared_count || 0
                      : curr.selected_count || curr.applicant_count || 0,
                  )
                );
              }, 0);

              const totalB = groupItems.reduce((acc, curr) => {
                // Total candidates for comparison
                return (
                  acc +
                  Number(
                    activeCategory === "TURNOUT"
                      ? curr.called_count || 0
                      : curr.appeared_count || 0,
                  )
                );
              }, 0);

              return (
                <div key={groupName} className={styles.reportSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.groupHeading}>
                      {groupName}
                      {reportType === "block" && (
                        <span className={styles.totalBadge}>
                          (Total:{" "}
                          {activeCategory === "NMMS" ||
                          activeCategory === "SELECTS"
                            ? totalA
                            : `${totalA}/${totalB}`}
                          )
                        </span>
                      )}
                    </h3>
                  </div>

                  {activeCategory === "TURNOUT" ||
                  activeCategory === "SELECTION" ? (
                    <div className={styles.rainbowConsolidatedWrapper}>
                      <div className={styles.largeChartContainer}>
                        <Doughnut
                          ref={(el) => (chartRefs.current[groupName] = el)}
                          plugins={[whiteBackgroundPlugin]}
                          data={{
                            labels: groupItems.map((i) => i.label),
                            datasets: groupItems.map((item, idx) => {
                              const pct = Number(
                                activeCategory === "TURNOUT"
                                  ? item.turnout_percentage
                                  : item.selection_percentage,
                              );
                              const totalItems = groupItems.length;
                              const ringThickness = 80 / totalItems;
                              const cutoutValue =
                                100 - ringThickness * (idx + 1);

                              return {
                                data: [pct, 100 - pct],
                                backgroundColor: [
                                  `hsla(${idx * (360 / totalItems)}, 75%, 55%, 1)`,
                                  "rgba(241, 245, 249, 0.4)",
                                ],
                                circumference: 180,
                                rotation: 270,
                                borderWidth: 0,
                                spacing: -1,
                                weight: 1,
                                cutout: `${cutoutValue}%`,
                                datalabels: {
                                  display: true,
                                  color: "#64748b",
                                  font: { weight: "bold", size: 10 },
                                  formatter: (val, ctx) =>
                                    ctx.dataIndex === 0 ? `${pct}%` : "",
                                  anchor: "center",
                                  align: "center",
                                },
                              };
                            }),
                          }}
                          options={{
                            plugins: { legend: { display: false } },
                            maintainAspectRatio: false,
                          }}
                        />
                      </div>

                      <div className={styles.rainbowStripGrid}>
                        {groupItems.map((item, idx) => {
                          const a =
                            activeCategory === "TURNOUT"
                              ? item.appeared_count
                              : item.selected_count;
                          const b =
                            activeCategory === "TURNOUT"
                              ? item.called_count
                              : item.appeared_count;
                          return (
                            <div key={idx} className={styles.rainbowStripItem}>
                              <div
                                className={styles.stripColorBar}
                                style={{
                                  backgroundColor: `hsla(${idx * (360 / groupItems.length)}, 75%, 55%, 1)`,
                                }}
                              ></div>
                              <div className={styles.stripInfo}>
                                <div className={styles.stripLabel}>
                                  {item.label}
                                </div>
                                <div className={styles.stripStats}>
                                  <span className={styles.pctBadge}>
                                    {activeCategory === "TURNOUT"
                                      ? item.turnout_percentage
                                      : item.selection_percentage}
                                    %
                                  </span>
                                  <span className={styles.countRatio}>
                                    &nbsp;&nbsp;({Number(a)} / {Number(b)})
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.chartCard}>
                        <Bar
                          ref={(el) => (chartRefs.current[groupName] = el)}
                          plugins={[whiteBackgroundPlugin]}
                          data={{
                            labels: groupItems.map((i) => i.label),
                            // Stacked Bar configuration
                            datasets:
                              activeCategory === "SELECTS"
                                ? [
                                    {
                                      label: "Boys Selected",
                                      data: groupItems.map((i) => i.boys_sel),
                                      backgroundColor: "#3b82f6", // Blue
                                    },
                                    {
                                      label: "Girls Selected",
                                      data: groupItems.map((i) => i.girls_sel),
                                      backgroundColor: "#ec4899", // Pink
                                    },
                                  ]
                                : [
                                    {
                                      label: "Student Count",
                                      data: groupItems.map(
                                        (i) => Number(i.applicant_count) || 0,
                                      ),
                                      backgroundColor: groupItems.map(
                                        (_, i) =>
                                          `hsla(${i * (360 / groupItems.length)}, 70%, 60%, 0.8)`,
                                      ),
                                      borderRadius: 6,
                                    },
                                  ],
                          }}
                          options={{
                            indexAxis: reportType === "district" ? "x" : "y",
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: activeCategory === "SELECTS" },
                              datalabels: {
                                anchor: "center",
                                align: "center",
                                formatter: (val) => (val > 0 ? val : ""),
                                font: { weight: "bold", size: 10 },
                                color: "#fff", // White labels inside colored segments
                              },
                            },
                            scales: {
                              x: { stacked: true },
                              y: { stacked: true, beginAtZero: true },
                            },
                          }}
                        />
                      </div>

                      <div className={styles.rainbowStripGrid}>
                        {groupItems.map((item, idx) => (
                          <div key={idx} className={styles.rainbowStripItem}>
                            <div
                              className={styles.stripColorBar}
                              style={{
                                background:
                                  activeCategory === "SELECTS"
                                    ? "linear-gradient(#3b82f6, #ec4899)"
                                    : `hsla(${idx * (360 / groupItems.length)}, 70%, 60%, 0.8)`,
                              }}
                            ></div>
                            <div className={styles.stripInfo}>
                              <div className={styles.stripLabel}>
                                {item.label}
                              </div>
                              <div className={styles.stripStats}>
                                {activeCategory === "SELECTS" ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "4px",
                                    }}
                                  >
                                    <span
                                      className={styles.miniValue}
                                      style={{
                                        color: "#3b82f6",
                                        fontSize: "0.85rem",
                                      }}
                                    >
                                      Boys Selected: <b>{item.boys_sel}</b>
                                    </span>
                                    <span
                                      className={styles.miniValue}
                                      style={{
                                        color: "#ec4899",
                                        fontSize: "0.85rem",
                                      }}
                                    >
                                      Girls Selected: <b>{item.girls_sel}</b>
                                    </span>
                                  </div>
                                ) : (
                                  <span
                                    className={styles.miniValue}
                                    style={{ color: "#64748b" }}
                                  >
                                    <b>{Number(item.applicant_count) || 0}</b>{" "}
                                    Students
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default SelectionReports;
