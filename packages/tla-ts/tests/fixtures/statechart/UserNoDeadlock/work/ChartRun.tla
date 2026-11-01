---- MODULE ChartRun ----
EXTENDS UserNoDeadlock
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~NoDeadlock THEN {"NoDeadlock"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-75f1cab06ae0e2001f4e950597e90091", <<x>>, ChartBroken>>)
====