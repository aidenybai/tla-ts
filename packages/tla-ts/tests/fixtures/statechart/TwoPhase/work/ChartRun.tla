---- MODULE ChartRun ----
EXTENDS TwoPhase
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~TPTypeOK THEN {"TPTypeOK"} ELSE {}) \cup (IF ~TCConsistent THEN {"TCConsistent"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-d13bb883ffaced1e04beaa89dce4f410", <<rmState, tmState, tmPrepared, msgs>>, ChartBroken>>)
====