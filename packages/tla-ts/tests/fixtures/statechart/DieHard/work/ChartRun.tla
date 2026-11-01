---- MODULE ChartRun ----
EXTENDS DieHard
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~TypeOK THEN {"TypeOK"} ELSE {}) \cup (IF ~NotSolved THEN {"NotSolved"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-e4e236e3081c3e93739f977ff9cfb47d", <<big, small>>, ChartBroken>>)
====