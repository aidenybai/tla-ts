---- MODULE ContinueSuccessors ----
EXTENDS Naturals
VARIABLES x, y

Init == x = 0 /\ y = 0
Next == \/ x < 2 /\ x' = x + 1 /\ UNCHANGED y
        \/ x = 2 /\ y < 2 /\ y' = y + 1 /\ UNCHANGED x
Spec == Init /\ [][Next]_<<x, y>>

NotTwo == x /= 2
YSmall == y < 2
YPositive == y > 0
Steps == [][x' >= x]_x /\ [][y' # 1]_y
====
