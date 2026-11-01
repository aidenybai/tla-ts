---- MODULE ChartRun ----
EXTENDS CounterInstance
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-e817d4f5bd47a0227c27a3c98a9b89c3", <<x>>, ChartBroken>>)
====