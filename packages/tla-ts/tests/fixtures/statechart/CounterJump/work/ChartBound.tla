---- MODULE ChartBound ----
EXTENDS CounterJump
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBound == ChartNaturals!<(ChartTLC!TLCGet("distinct"), 100000)
====