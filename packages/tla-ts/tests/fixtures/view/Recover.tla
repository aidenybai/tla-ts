---- MODULE Recover ----
EXTENDS Naturals
VARIABLES x, y
vars == <<x, y>>
Init == x = 0 /\ y = 0
A == x = 0 /\ x' = 1 /\ y' = y
E == x = 0 /\ y = 0 /\ x' = 2 /\ y' = 1
B == x = 1 /\ x' = 2 /\ y' = y
F == x = 2 /\ y = 1 /\ x' = 0 /\ y' = 0
Next == A \/ E \/ B \/ F
Spec == Init /\ [][Next]_vars /\ WF_vars(Next) /\ SF_vars(A)
Never == []<>(x = 5)
View == x
====
