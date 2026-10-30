---- MODULE Counted ----
EXTENDS Naturals
CONSTANT Limit
Below(x) == x < Limit
THEOREM Positive == Limit = Limit
====
