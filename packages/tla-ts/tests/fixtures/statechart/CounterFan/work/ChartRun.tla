---- MODULE ChartRun ----
EXTENDS CounterFan
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~NotDone THEN {"NotDone"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-b8e39049e50ccc34e8b91bf8f6200b33", <<x, done>>, ChartBroken>>)
====