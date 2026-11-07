---- MODULE LiteralMismatch ----
EXTENDS Integers

VARIABLE x

Pair(i) == <<1, 2>>
Sorted(i) == [a |-> 1, b |-> 2]

Init == x = Pair(0)

Next == x' = IF x = Pair(0) THEN Sorted(0) ELSE Pair(0)
====
