---- MODULE ChartRun ----
EXTENDS CounterStart
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~TypeOK THEN {"TypeOK"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-7df6deddc989c625f5e7c11cb069d407", <<x>>, ChartBroken>>)
====