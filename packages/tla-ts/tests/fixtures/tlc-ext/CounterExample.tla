--------------------------- MODULE CounterExample ---------------------------
EXTENDS Naturals, TLC, TLCExt

CONSTANT Cycle

VARIABLE x

Init == x = 0

Up == x < 2 /\ x' = x + 1

Back == Cycle /\ x = 2 /\ x' = 1

Next == Up \/ Back

Spec == Init /\ [][Next]_x /\ WF_x(Next)

Small == x < 2

Large == <>(x = 5)

\* TLC binds CounterExample to the behavior that violates a property when it
\* checks the postcondition.
Steps == {<<step[1][1], step[2].name, step[3][1]>> : step \in CounterExample.action}

Post == PrintT(ToTrace(CounterExample)) /\ PrintT(Steps)

\* A false postcondition after a violation does not change TLC's exit status.
Fails == Post /\ FALSE
=============================================================================
