import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
} from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

const shared = {
  accentColor: "hsl(185 80% 39%)",
  fontFamily: "inherit",
  headerFontWeight: 600,
  borderRadius: 8,
  wrapperBorderRadius: 12,
  cellHorizontalPadding: 14,
} as const;

export const gridLightTheme = themeQuartz.withParams({
  ...shared,
  backgroundColor: "hsl(0 0% 100%)",
  foregroundColor: "hsl(217 33% 17%)",
  headerBackgroundColor: "hsl(210 40% 96.1%)",
  headerTextColor: "hsl(217 33% 17%)",
  borderColor: "hsl(214.3 31.8% 91.4%)",
  rowHoverColor: "hsl(185 80% 39% / 0.06)",
  selectedRowBackgroundColor: "hsl(185 80% 39% / 0.1)",
  browserColorScheme: "light",
});

export const gridDarkTheme = themeQuartz.withParams({
  ...shared,
  backgroundColor: "hsl(222 47% 13%)",
  foregroundColor: "hsl(210 40% 98%)",
  headerBackgroundColor: "hsl(217 33% 17%)",
  headerTextColor: "hsl(210 40% 98%)",
  borderColor: "hsl(217 33% 20%)",
  chromeBackgroundColor: "hsl(217 33% 15%)",
  rowHoverColor: "hsl(185 80% 39% / 0.12)",
  selectedRowBackgroundColor: "hsl(185 80% 39% / 0.18)",
  browserColorScheme: "dark",
});
