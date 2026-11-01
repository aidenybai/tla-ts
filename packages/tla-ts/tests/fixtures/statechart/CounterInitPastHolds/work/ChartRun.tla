---- MODULE ChartRun ----
EXTENDS CounterInitPastHolds
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~Pos THEN {"Pos"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-7159b11fb05a3325f3d1c140e38e7b7e", <<x>>, ChartBroken>>)
====