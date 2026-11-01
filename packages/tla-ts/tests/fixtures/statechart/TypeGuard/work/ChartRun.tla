---- MODULE ChartRun ----
EXTENDS TypeGuard
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~TypeOK THEN {"TypeOK"} ELSE {}) \cup (IF ~NeedsTypeOK THEN {"NeedsTypeOK"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-5f2421400626aa3c50fdc5cf9419639e", <<x>>, ChartBroken>>)
====