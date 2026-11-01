---- MODULE ChartRun ----
EXTENDS LoginGuarded
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~TypeOK THEN {"TypeOK"} ELSE {}) \cup (IF ~SignedInWhileLocked THEN {"SignedInWhileLocked"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-e296cb0a8ca19fc56a8f4c01d654da3b", <<session, wrongTries>>, ChartBroken>>)
====