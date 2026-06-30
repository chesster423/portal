const NAV_ITEMS = [
  { id: "stats", label: "Stats", heroTitle: "Dashboard" },
  { id: "games", label: "Games", heroTitle: "Game Reviews" },
  { id: "gunpla", label: "Gunpla", heroTitle: "Gundam Collection" },
  { id: "gold", label: "Gold", heroTitle: "Gold Collection" },
  { id: "resume", label: "Resume", heroTitle: "Resume" },
  { id: "learnings", label: "Learnings", heroTitle: "My Life Learnings" },
];

function formatClock(date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function activeBgId(activeNav, hoverNav) {
  return hoverNav || activeNav;
}

export function registerPortalApp(angular, hooks) {
  const app = angular.module("portalApp", []);

  app.controller("PortalController", [
    "$interval",
    "$scope",
    function PortalController($interval, $scope) {
      const vm = this;
      vm.navItems = NAV_ITEMS;
      vm.activeNav = "stats";
      vm.hoverNav = null;
      vm.currentTime = formatClock(new Date());
      vm.base = hooks.base;

      vm.activeItem = function activeItem() {
        const id = vm.hoverNav || vm.activeNav;
        return NAV_ITEMS.find((item) => item.id === id) || NAV_ITEMS[0];
      };

      vm.bgId = function bgId() {
        return activeBgId(vm.activeNav, vm.hoverNav);
      };

      vm.isNavState = function isNavState(item, state) {
        if (state === "active") return vm.activeNav === item.id;
        if (state === "hover") return vm.hoverNav === item.id;
        return vm.activeNav === item.id || vm.hoverNav === item.id;
      };

      vm.selectNav = function selectNav(id) {
        if (vm.activeNav === id) return;
        vm.activeNav = id;
        hooks.onNavChange(id);
      };

      vm.onNavEnter = function onNavEnter(id) {
        vm.hoverNav = id;
      };

      vm.onNavLeave = function onNavLeave() {
        vm.hoverNav = null;
      };

      vm.focusSearch = function focusSearch() {
        hooks.onSearchFocus();
      };

      $interval(() => {
        vm.currentTime = formatClock(new Date());
      }, 30000);

      hooks.bindController(vm, $scope);
    },
  ]);

  return app;
}

export function bootstrapPortal(angular, hooks) {
  registerPortalApp(angular, hooks);
  const root = document.querySelector(".ps5-shell");
  if (!root) {
    throw new Error("Missing .ps5-shell root element for Angular bootstrap.");
  }
  angular.bootstrap(root, ["portalApp"], { strictDi: true });
}
