-------------------------------- MODULE View --------------------------------
EXTENDS Naturals

VARIABLES x, steps

vars == <<x, steps>>

Init == x = 0 /\ steps = 0

Move == x < 3 /\ x' = x + 1 /\ steps' = steps + 1

Wait == x = 3 /\ steps' = steps + 1 /\ UNCHANGED x

Spec == Init /\ [][Move \/ Wait]_vars /\ WF_vars(Move) /\ WF_vars(Wait)

Position == x

Waits == []<><<Wait>>_vars

Bounded == steps < 10
=============================================================================
