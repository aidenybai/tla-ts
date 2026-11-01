---- MODULE ChartRun ----
EXTENDS TwoPhaseFixed
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~TPTypeOK THEN {"TPTypeOK"} ELSE {}) \cup (IF ~TCConsistent THEN {"TCConsistent"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-7e48516e7987132099ce89cb20d0b02a", <<rmState, tmState, tmPrepared, msgs>>, ChartBroken>>)
====