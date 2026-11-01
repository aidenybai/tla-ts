---- MODULE ChartRun ----
EXTENDS CounterRules
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~NotTwo THEN {"NotTwo"} ELSE {}) \cup (IF ~NotThree THEN {"NotThree"} ELSE {}) \cup (IF ~AtMostTwo THEN {"AtMostTwo"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-ed5c8d3a4aa574ed5ac1e677664ff135", <<x>>, ChartBroken>>)
====