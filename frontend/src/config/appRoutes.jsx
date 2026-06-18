import BasicInfo from "@/pages/BasicInfo";
import DocumentSetup from "@/pages/DocumentSetup";
import Review from "@/pages/Review";
import Credits from "@/pages/Credits";
import CheckIssuance from "@/pages/CheckIssuance";
import Bookkeeping from "@/pages/Bookkeeping";
import SystemManagement from "@/pages/SystemManagement";
import Guarantees from "@/pages/Guarantees";
import Deposits from "@/pages/Deposits";
import Placeholder from "@/pages/Placeholder";
import { getAllMenuRoutes } from "@/config/navigation";

/** صفحاتی که پیاده‌سازی شده‌اند — بقیه خودکار Placeholder می‌شوند */
export const PAGE_COMPONENTS = {
  "/basic-info": BasicInfo,
  "/basic-info/credits": Credits,
  "/basic-info/document-setup": DocumentSetup,
  "/basic-info/check-issuance": CheckIssuance,
  "/basic-info/bookkeeping": Bookkeeping,
  "/document-setup": DocumentSetup,
  "/review": Review,
  "/credits": Credits,
  "/check-issuance": CheckIssuance,
  "/bookkeeping": Bookkeeping,
  "/system-management": SystemManagement,
  "/guarantees": Guarantees,
  "/deposits": Deposits,
};

export function buildLayoutRoutes(HomePage) {
  const menuRoutes = getAllMenuRoutes();
  const routes = [{ path: "/", element: <HomePage /> }];

  for (const { path, label } of menuRoutes) {
    const Component = PAGE_COMPONENTS[path];
    routes.push({
      path,
      element: Component ? <Component /> : <Placeholder label={label} />,
    });
  }

  return routes;
}
