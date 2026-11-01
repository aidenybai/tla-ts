---- MODULE ChartRun ----
EXTENDS MediaPlayerFixed
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~TypeOK THEN {"TypeOK"} ELSE {}) \cup (IF ~LoudWhenStopped THEN {"LoudWhenStopped"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-0aca02df3de2368f5d2d1847715fa8f7", <<playback, volume>>, ChartBroken>>)
====