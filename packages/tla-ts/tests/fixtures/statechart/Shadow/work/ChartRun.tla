---- MODULE ChartRun ----
EXTENDS Shadow
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-d9a1bd525c483f8d82f80e8222a13608", <<x>>, ChartBroken>>)
====