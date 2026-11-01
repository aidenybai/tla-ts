---- MODULE ChartRun ----
EXTENDS CounterTieInGraph
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~OneOrThree THEN {"OneOrThree"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-0a0a122fd39178f1f989399ddce20d02", <<x>>, ChartBroken>>)
====