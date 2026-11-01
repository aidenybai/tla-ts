---- MODULE ChartRun ----
EXTENDS CounterOrder
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~Even THEN {"Even"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-f16cff3065e1fe0493f97a47bc8ecad2", <<x>>, ChartBroken>>)
====