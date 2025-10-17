import React, {
  lazy,
  Suspense,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../../hooks/useUserAuth";
import { UserContext } from "../../context/userContext";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { addThousandsSeparator } from "../../utils/helper";
import { DEFAULT_OFFICE_LOCATIONS } from "../../utils/data";
import { getPrivilegedBasePath } from "../../utils/roleUtils";
import InfoCard from "../../components/Cards/infoCard";
import {
  LuArrowRight,
  LuBadgeCheck,
  LuClipboardList,
  LuClock3,
  LuRefreshCcw
} from "react-icons/lu";
import LoadingOverlay from "../../components/LoadingOverlay";
import useActiveNotices from "../../hooks/useActiveNotices";
import { formatFullDateTime } from "../../utils/dateUtils";

const NoticeBoard = lazy(() => import("../../components/NoticeBoard"));
const CustomPieChart = lazy(() => import("../../components/Charts/CustomPieChart"));
const CustomBarChart = lazy(() => import("../../components/Charts/CustomBarChart"));
const TaskListTable = lazy(() => import("../../components/TaskListTable"));
const LeaderboardTable = lazy(() => import("../../components/LeaderboardTable"));

const getGreetingMessage = (hour) => {
  if (hour < 12) {
    return "Good Morning";
  }

  if (hour < 17) {
    return "Good Afternoon";
  }

  return "Good Evening";
};  

const LiveGreeting = React.memo(({ userName }) => {
  const [currentMoment, setCurrentMoment] = useState(() => new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentMoment(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const greetingMessage = useMemo(
    () => getGreetingMessage(currentMoment.getHours()),
    [currentMoment]
  );

  const formattedDate = useMemo(
    () => formatFullDateTime(currentMoment),
    [currentMoment]
  );

  return (
    <>
      <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
        {greetingMessage}, {userName}
      </h2>
      <p className="mt-3 text-sm text-white/70">{formattedDate}</p>
    </>
  );
});

const COLORS = ["#8D51FF", "#00B8DB", "#7BCE00"];

const Dashboard = () => {
  useUserAuth();

  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [pieChartData, setPieChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardFilter, setLeaderboardFilter] = useState("All");
  const [leaderboardOfficeFilter, setLeaderboardOfficeFilter] =
    useState("All");
  const { activeNotices, fetchActiveNotices, resetNotices } =
    useActiveNotices(false);

  const prepareChartData = useCallback((data) => {
    const taskDistribution = data?.taskDistribution || null;
    const taskPriorityLevels = data?.taskPriorityLevels || null;

    const taskDistributionData = [
      { status: "Pending", count: taskDistribution?.Pending || 0 },
      { status: "In Progress", count: taskDistribution?.InProgress || 0 },
      { status: "Completed", count: taskDistribution?.Completed || 0 }
    ];

    setPieChartData(taskDistributionData);

    const PriorityLevelData = [
      { priority: "Low", count: taskPriorityLevels?.Low || 0 },
      { priority: "Medium", count: taskPriorityLevels?.Medium || 0 },
      { priority: "High", count: taskPriorityLevels?.High || 0 }
    ];

    setBarChartData(PriorityLevelData);
  }, []);

  const getDashboardData = useCallback(async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.TASKS.GET_DASHBOARD_DATA
      );
      if (response.data) {
        setDashboardData(response.data);
        prepareChartData(response.data?.charts || null);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [prepareChartData]);

  const privilegedBasePath = useMemo(
    () => getPrivilegedBasePath(user?.role),
    [user?.role]
  );

  const onSeeMore = () => {
    navigate(`${privilegedBasePath}/tasks`);
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setDashboardData(null);
        setPieChartData([]);
        setBarChartData([]);
        resetNotices();

        setLeaderboardFilter("All");
        setLeaderboardOfficeFilter("All");       
        await Promise.all([getDashboardData(), fetchActiveNotices()]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();

    return () => {};
  }, [fetchActiveNotices, getDashboardData, resetNotices, user?._id]);

  const infoCards = useMemo(
    () => [
      {
        label: "Total Tasks",
        value: addThousandsSeparator(
          dashboardData?.charts?.taskDistribution?.All || 0
        ),
        color: "from-primary via-indigo-500 to-sky-400",
        icon: LuClipboardList,
        filterStatus: "All"
      },
      {
        label: "Pending Tasks",
        value: addThousandsSeparator(
          dashboardData?.charts?.taskDistribution?.Pending || 0
        ),
        color: "from-amber-400 via-orange-500 to-red-400",
        icon: LuClock3,
        filterStatus: "Pending"
      },
      {
        label: "In Progress",
        value: addThousandsSeparator(
          dashboardData?.charts?.taskDistribution?.InProgress || 0
        ),
        color: "from-sky-400 via-cyan-500 to-emerald-400",
        icon: LuRefreshCcw,
        filterStatus: "In Progress"
      },
      {
        label: "Completed Tasks",
        value: addThousandsSeparator(
          dashboardData?.charts?.taskDistribution?.Completed || 0
        ),
        color: "from-emerald-400 via-lime-400 to-green-500",
        icon: LuBadgeCheck,
        filterStatus: "Completed"
      }
    ],
    [dashboardData?.charts?.taskDistribution]
  );

  const handleCardClick = (filterStatus) => {
    navigate(`${privilegedBasePath}/tasks`, { state: { filterStatus } });
  };

  const safeLeaderboardData = useMemo(() => {
    if (!Array.isArray(dashboardData?.leaderboard)) {
      return [];
    }

    return [...dashboardData.leaderboard].sort((a, b) => {
      if (a?.rank && b?.rank) {
        return a.rank - b.rank;
      }

      if (a?.rank) {
        return -1;
      }

      if (b?.rank) {
        return 1;
      }

      return Number(b?.score || 0) - Number(a?.score || 0);
    });
  }, [dashboardData?.leaderboard]);

  const filteredLeaderboard = useMemo(() => {
    const normalizedRoleFilter =
      typeof leaderboardFilter === "string"
        ? leaderboardFilter.trim().toLowerCase()
        : "";
    const normalizedOfficeFilter =
      typeof leaderboardOfficeFilter === "string"
        ? leaderboardOfficeFilter.trim().toLowerCase()
        : "";

    return safeLeaderboardData.filter((entry) => {
      const matchesRole =
        normalizedRoleFilter === "all" || !normalizedRoleFilter
          ? true
          : normalizedRoleFilter === "admin"
          ? entry.role === "admin"
          : entry.role === "member";

      const entryOffice = (entry.officeLocation || "")
        .toString()
        .trim()
        .toLowerCase();          
      const matchesOffice =
        normalizedOfficeFilter === "all" || !normalizedOfficeFilter
          ? true
          : entryOffice === normalizedOfficeFilter;

      return matchesRole && matchesOffice;
    });
  }, [
    leaderboardFilter,
    leaderboardOfficeFilter,
    safeLeaderboardData
  ]);

  const visibleTopPerformer = filteredLeaderboard[0] || null;
  const topPerformerScore = useMemo(
    () =>
      visibleTopPerformer
        ? Number(visibleTopPerformer.score || 0).toLocaleString()
        : null,
    [visibleTopPerformer]
  );

  const leaderboardRoleFilters = ["All", "Admin", "Members"];
  const leaderboardOfficeFilters = useMemo(() => {
    const locationMap = new Map();

    DEFAULT_OFFICE_LOCATIONS.forEach((location) => {
      const trimmedLocation =
        typeof location === "string" ? location.trim() : "";

      if (!trimmedLocation) {
        return;
      }

      locationMap.set(trimmedLocation.toLowerCase(), trimmedLocation);
    });

    safeLeaderboardData.forEach((entry) => {
      const rawLocation =
        typeof entry?.officeLocation === "string"
          ? entry.officeLocation.trim()
          : "";

      if (!rawLocation) {
        return;
      }

      const normalizedLocation = rawLocation.toLowerCase();

      if (!locationMap.has(normalizedLocation)) {
        locationMap.set(normalizedLocation, rawLocation);
      }
    });

    const sortedLocations = Array.from(locationMap.values()).sort(
      (first, second) => first.localeCompare(second)
    );

    return ["All", ...sortedLocations];
  }, [safeLeaderboardData]);

  useEffect(() => {
    if (
      typeof leaderboardOfficeFilter === "string" &&
      leaderboardOfficeFilter &&
      !leaderboardOfficeFilters.includes(leaderboardOfficeFilter)
    ) {
      setLeaderboardOfficeFilter("All");
    }
  }, [leaderboardOfficeFilter, leaderboardOfficeFilters]);

  return (
    <DashboardLayout activeMenu="Dashboard">
     {isLoading ? (
        <LoadingOverlay message="Loading workspace overview..." className="py-24" />
      ) : (
        <>
          <Suspense
            fallback={
              <div className="card mb-6 animate-pulse bg-white/60 text-sm text-slate-500">
                Loading announcements...
              </div>
            }
          >
            <NoticeBoard notices={activeNotices} />
          </Suspense>

          <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-primary via-indigo-500 to-sky-500 px-4 py-8 text-white shadow-[0_20px_45px_rgba(59,130,246,0.25)] sm:px-6 sm:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2),_transparent_65%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.18),_transparent_60%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.42em] text-white/70">Welcome Back</p>
                <LiveGreeting userName={user?.name || "User"} />
              </div>

              <div className="rounded-3xl border border-white/40 bg-white/15 px-4 py-4 text-sm backdrop-blur sm:px-6">
                <p className="text-xs uppercase tracking-[0.28em] text-white/70">Today&apos;s Focus</p>
                <p className="mt-2 text-base font-medium">
                  Align priorities, unblock your team and watch progress accelerate.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {infoCards.map((card) => (
              <InfoCard
                key={card.label}
                label={card.label}
                value={card.value}
                color={card.color}
                icon={card.icon}
                onClick={() => handleCardClick(card.filterStatus)}
              />
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <div className="flex items-center justify-between">
                <h5 className="text-base font-semibold text-slate-900">Task Distribution</h5>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
                  Overview
                </span>
              </div>

              <Suspense
                fallback={
                  <div className="flex h-[325px] items-center justify-center text-sm text-slate-500">
                    Loading chart data...
                  </div>
                }
              >
                <CustomPieChart data={pieChartData} colors={COLORS} />
              </Suspense>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <h5 className="text-base font-semibold text-slate-900">Task Priority Levels</h5>
                <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                  Priority Mix
                </span>
              </div>

              <Suspense
                fallback={
                  <div className="flex h-[325px] items-center justify-center text-sm text-slate-500">
                    Loading chart data...
                  </div>
                }
              >
                <CustomBarChart data={barChartData} />
              </Suspense>
            </div>
          </section>

          <section className="card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h5 className="text-lg font-semibold text-slate-900">Recent Tasks</h5>
                <p className="text-sm text-slate-500">
                  Monitor the latest updates across the workspace at a glance.
                </p>
              </div>

              <button className="card-btn" onClick={onSeeMore}>
                See All <LuArrowRight className="text-base" />
              </button>
            </div>

            <Suspense
              fallback={
                <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                  Loading recent tasks...
                </div>
              }
            >
              <TaskListTable tableData={dashboardData?.recentTasks || []} />
            </Suspense>
          </section>
          
          <section className="card">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h5 className="text-lg font-semibold text-slate-900">
                  Employee Leaderboard
                </h5>
                <p className="text-sm text-slate-500">
                  Celebrate on-time delivery and shine a light on the most reliable teammates.
                </p>
                {visibleTopPerformer ? (
                  <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Top Performer · {visibleTopPerformer.name} · Score {topPerformerScore}
                  </p>
                ) : (
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    Leaderboard updates once work is completed.
                  </p>
                )}
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-end sm:gap-4">
                <div className="flex w-full flex-col sm:w-auto">
                  <label
                    className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500"
                    htmlFor="leaderboard-role-filter"
                  >
                    Team Role
                  </label>
                  <div className="custom-select mt-2 min-w-[180px] sm:min-w-[200px]">
                    <select
                      id="leaderboard-role-filter"
                      value={leaderboardFilter}
                      onChange={(event) => setLeaderboardFilter(event.target.value)}
                      className="custom-select__field"
                    >
                      {leaderboardRoleFilters.map((filter) => (
                        <option key={filter} value={filter}>
                          {filter}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex w-full flex-col sm:w-auto">
                  <label
                    className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500"
                    htmlFor="leaderboard-office-filter"
                  >
                    Office
                  </label>
                  <div className="custom-select mt-2 min-w-[180px] sm:min-w-[200px]">
                    <select
                      id="leaderboard-office-filter"
                      value={leaderboardOfficeFilter}
                      onChange={(event) =>
                        setLeaderboardOfficeFilter(event.target.value)
                      }
                      className="custom-select__field"
                    >
                      {leaderboardOfficeFilters.map((filter) => (
                        <option key={filter} value={filter}>
                          {filter}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <Suspense
              fallback={
                <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                  Loading leaderboard...
                </div>
              }
            >
              <LeaderboardTable entries={filteredLeaderboard} />
            </Suspense>
          </section>
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;