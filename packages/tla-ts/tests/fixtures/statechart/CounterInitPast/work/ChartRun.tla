---- MODULE ChartRun ----
EXTENDS CounterInitPast
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~NotNine THEN {"NotNine"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-4932c0292e3b491898ce1f96d577079f", <<x>>, ChartBroken>>)
====