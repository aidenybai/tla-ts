---- MODULE ChartRun ----
EXTENDS HiddenClock
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-d621491e880811c51f1a4e7de521fbda", <<x, clock>>, ChartBroken>>)
====