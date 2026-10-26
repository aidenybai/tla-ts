---- MODULE NestedModules ----
EXTENDS Naturals
CONSTANT Max
VARIABLES x, y
Limit == Max + 1

---- MODULE Clock ----
CONSTANT Step
Tick(n) == (n + Step) % Limit
====

---- MODULE Bounded ----
EXTENDS Clock
VARIABLE t
Next == t' = Tick(t)
Safe == t < Limit
====

---- MODULE Pair ----
---- MODULE Half ----
Next == x' = (x + 1) % Limit
====
H == INSTANCE Half
Next == H!Next /\ UNCHANGED y
====

X == INSTANCE Bounded WITH Step <- 1, t <- x
Y(t) == INSTANCE Bounded WITH Step <- 2
P == INSTANCE Pair

Init == x = 0 /\ y = 0
Next == (X!Next /\ UNCHANGED y) \/ (Y(y)!Next /\ UNCHANGED x) \/ P!Next
Inv == X!Safe /\ Y(y)!Safe
====
