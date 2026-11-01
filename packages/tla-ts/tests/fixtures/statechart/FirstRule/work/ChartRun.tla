---- MODULE ChartRun ----
EXTENDS FirstRule
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~NotOne THEN {"NotOne"} ELSE {}) \cup (IF ~NotOneOrThree THEN {"NotOneOrThree"} ELSE {}) \cup (IF ~AlsoNotOne THEN {"AlsoNotOne"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-c21c68d7700173857cd5c78a674fc044", <<x>>, ChartBroken>>)
====