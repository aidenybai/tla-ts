---- MODULE ChartBound ----
EXTENDS CounterAction
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBound == ChartNaturals!<(ChartTLC!TLCGet("distinct"), 100000)
====