---- MODULE ChartRun ----
EXTENDS CounterDeadlock
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~NotThree THEN {"NotThree"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-2f3aa55828696124ab18502bc10ba6ba", <<x>>, ChartBroken>>)
====