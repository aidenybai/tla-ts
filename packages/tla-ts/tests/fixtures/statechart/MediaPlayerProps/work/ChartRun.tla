---- MODULE ChartRun ----
EXTENDS MediaPlayerProps
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~TypeOK THEN {"TypeOK"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-dc178b77a6abd603853e8da4270cab04", <<playback, volume>>, ChartBroken>>)
====