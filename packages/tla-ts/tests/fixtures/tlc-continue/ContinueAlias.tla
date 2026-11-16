---- MODULE ContinueAlias ----
EXTENDS Naturals, TLC
VARIABLE x

Init == x = 0
Next == x < 3 /\ x' = x + 1
Spec == Init /\ [][Next]_x

NotOne == x /= 1
Level == TLCGet("level") = x + 1
Alias == [x |-> x, level |-> TLCGet("level")]
====
