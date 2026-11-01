---- MODULE ChartRun ----
EXTENDS SpacedNames
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~Going THEN {"Going"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-99367d8a0bf47920cfe069d07e7aa43d", <<s, t>>, ChartBroken>>)
====