---- MODULE ChartRun ----
EXTENDS CounterTie
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~NotThree THEN {"NotThree"} ELSE {}) \cup (IF ~NotFive THEN {"NotFive"} ELSE {}) \cup (IF ~NotOdd THEN {"NotOdd"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-8444a8c2d92fe2b29a5b431719debb0f", <<x>>, ChartBroken>>)
====