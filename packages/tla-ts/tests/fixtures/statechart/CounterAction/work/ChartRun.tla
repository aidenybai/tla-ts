---- MODULE ChartRun ----
EXTENDS CounterAction
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~NotThree THEN {"NotThree"} ELSE {}) \cup (IF ~NotFour THEN {"NotFour"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-b7a16d4b9252813d5a028bd4707ddb2a", <<x>>, ChartBroken>>)
====