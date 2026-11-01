---- MODULE ChartRun ----
EXTENDS MediaPlayer
ChartTLC == INSTANCE TLC
ChartNaturals == INSTANCE Naturals
ChartBudget == ChartNaturals!<=(ChartTLC!TLCGet("distinct"), 500)
ChartBroken == (IF ~TypeOK THEN {"TypeOK"} ELSE {}) \cup (IF ~LoudWhenStopped THEN {"LoudWhenStopped"} ELSE {}) \cup {}
ChartMark == ChartBroken = {} \/ ChartTLC!PrintT(<<"chart-809cde6a685a3492f155efd1c804a3be", <<playback, volume>>, ChartBroken>>)
====