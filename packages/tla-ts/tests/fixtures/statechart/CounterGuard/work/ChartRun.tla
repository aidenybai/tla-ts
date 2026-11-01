---- MODULE ChartRun ----
EXTENDS CounterGuard
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~TypeOK THEN {"TypeOK"} ELSE {}) \cup (IF ~Lookup THEN {"Lookup"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-13ebe6338ea013e18df5bd954d439cd5", <<x>>, ChartBroken>>)
====