---- MODULE ChartRun ----
EXTENDS Login
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~TypeOK THEN {"TypeOK"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-ac74ef5b1c4cc06743ba7d851bd50e5e", <<main>>, ChartBroken>>)
====