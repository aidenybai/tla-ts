---- MODULE ChartRun ----
EXTENDS CounterView
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~NotThree THEN {"NotThree"} ELSE {}) \cup (IF ~NotFive THEN {"NotFive"} ELSE {}) \cup (IF ~NotOdd THEN {"NotOdd"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-9ba3f2f40b5b7d2515e6c9c8eb2078bb", <<x>>, ChartBroken>>)
====