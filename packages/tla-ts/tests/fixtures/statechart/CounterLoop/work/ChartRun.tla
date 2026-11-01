---- MODULE ChartRun ----
EXTENDS CounterLoop
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-b62b64ca2605aff4da942c323336f56d", <<x>>, ChartBroken>>)
====