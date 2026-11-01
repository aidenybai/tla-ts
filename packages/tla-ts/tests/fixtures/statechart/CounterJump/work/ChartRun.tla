---- MODULE ChartRun ----
EXTENDS CounterJump
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~NotThree THEN {"NotThree"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-78d6efcef1b883fec3ba839d4257d981", <<x, jumps>>, ChartBroken>>)
====