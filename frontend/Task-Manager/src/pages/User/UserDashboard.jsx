import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../../hooks/useUserAuth";
import { UserContext } from "../../context/userContext";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import moment from "moment";
import { addThousandsSeparator, getGreetingMessage } from "../../utils/helper";
import InfoCard from "../../components/Cards/infoCard";
import { LuArrowRight, LuBadgeCheck, LuClipboardList, LuClock3, LuRefreshCcw } from "react-icons/lu";
import TaskListTable from "../../components/TaskListTable";
import CustomPieChart from "../../components/Charts/CustomPieChart";
import CustomBarChart from "../../components/Charts/CustomBarChart";

const COLORS = ["#8D51FF", "#00B8DB", "#7BCE00"];

const UserDashboard = () => {
  useUserAuth();


  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [pieChartData, setPieChartData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [currentMoment, setCurrentMoment] = useState(moment());
  const [activeNotice, setActiveNotice] = useState(null);

  const prepareChartData = (data) => {
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
  };

  const getDashboardData = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.TASKS.GET_USER_DASHBOARD_DATA
      );
      if (response.data) {
        setDashboardData(response.data);
        prepareChartData(response.data?.charts || null);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchActiveNotice = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.NOTICES.GET_ACTIVE
      );
      setActiveNotice(response.data?.notice || null);
    } catch (error) {
      console.error("Error fetching notice:", error);
    }
  };

  const onSeeMore = () => {
    navigate("/admin/tasks");
  };

  useEffect(() => {
    getDashboardData();
    fetchActiveNotice();

    return () => {};
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentMoment(moment());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const infoCards = [
    {
      label: "Total Tasks",
      value: addThousandsSeparator(dashboardData?.charts?.taskDistribution?.All || 0),
      color: "from-primary via-indigo-500 to-sky-400",
      icon: LuClipboardList
    },
    {
      label: "Pending Tasks",
      value: addThousandsSeparator(dashboardData?.charts?.taskDistribution?.Pending || 0),
      color: "from-amber-400 via-orange-500 to-red-400",
      icon: LuClock3
    },
    {
      label: "In Progress",
      value: addThousandsSeparator(dashboardData?.charts?.taskDistribution?.InProgress || 0),
      color: "from-sky-400 via-cyan-500 to-emerald-400",
      icon: LuRefreshCcw
    },
    {
      label: "Completed Tasks",
      value: addThousandsSeparator(dashboardData?.charts?.taskDistribution?.Completed || 0),
      color: "from-emerald-400 via-lime-400 to-green-500",
      icon: LuBadgeCheck
    }
  ];

  return (
    <DashboardLayout activeMenu="Dashboard">
            {activeNotice && (
        <section className="overflow-hidden rounded-[24px] border border-indigo-100 bg-indigo-50/80 shadow-[0_18px_40px_rgba(79,70,229,0.12)]">
          <div className="flex items-center gap-2 bg-indigo-100/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.38em] text-indigo-600">
            <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            Notice Board
          </div>
          <div className="notice-marquee-wrapper">
            <div className="notice-marquee px-4 py-3 text-sm font-medium text-indigo-700">
              {activeNotice.message}
            </div>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-900 via-indigo-700 to-sky-600 px-6 py-10 text-white shadow-[0_20px_45px_rgba(30,64,175,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.22),_transparent_60%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-white/60">Hello</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              {getGreetingMessage()}, {user?.name}
            </h2>
            <p className="mt-3 text-sm text-white/70">
              {currentMoment.format("dddd Do MMMM YYYY • HH:mm:ss")}
            </p>
          </div>

          <div className="rounded-3xl border border-white/40 bg-white/15 px-6 py-4 text-sm backdrop-blur">
            <p className="text-xs uppercase tracking-[0.28em] text-white/70">Momentum</p>
            <p className="mt-2 text-base font-medium">
              Tick off tasks, celebrate the wins and keep the flow going.
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
    />
  ))}
</section>

<section className="grid gap-6 lg:grid-cols-2">
  <div className="card">
    <div className="flex items-center justify-between">
      <h5 className="text-base font-semibold text-slate-900">Task Distribution</h5>
      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
        Progress Mix
      </span>
    </div>

    <CustomPieChart data={pieChartData} colors={COLORS} />
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <h5 className="text-base font-semibold text-slate-900">Task Priority Levels</h5>
            <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Priorities
            </span>
          </div>

          <CustomBarChart data={barChartData} />
        </div>
      </section>

      <section className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h5 className="text-lg font-semibold text-slate-900">Recent Tasks</h5>
            <p className="text-sm text-slate-500">
              Revisit what&apos;s newly assigned and never miss the next step.
            </p>
          </div>

          <button className="card-btn" onClick={onSeeMore}>
            See All <LuArrowRight className="text-base" />
          </button>
        </div>

        <TaskListTable tableData={dashboardData?.recentTasks || []} />
      </section>
    </DashboardLayout>
  );
};

export default UserDashboard;