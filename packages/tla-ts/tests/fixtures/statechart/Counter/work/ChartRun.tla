---- MODULE ChartRun ----
EXTENDS Counter
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-3f665b15e32e4002f311e26c80432178", <<x>>, ChartBroken>>)
====