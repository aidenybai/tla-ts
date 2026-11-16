---- MODULE SubstOnce ----
EXTENDS Naturals, TLC
VARIABLE v
Doubled == Print(<<"eval", v>>, v)
I == INSTANCE SubstOnceInner WITH x <- Doubled
Init == v = 1
Next == v < 3 /\ v' = v + 1
Inv == I!Use = 2 * v
Prop == [][I!Step]_v
====
