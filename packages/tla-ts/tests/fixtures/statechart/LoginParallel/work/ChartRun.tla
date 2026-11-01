---- MODULE ChartRun ----
EXTENDS LoginParallel
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~TypeOK THEN {"TypeOK"} ELSE {}) \cup (IF ~SignedInWhileLocked THEN {"SignedInWhileLocked"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-4cd956926e142efbf92eed3b616fc194", <<session, wrongTries>>, ChartBroken>>)
====