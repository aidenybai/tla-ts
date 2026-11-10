---- MODULE SubstOnceInner ----
EXTENDS Naturals
VARIABLE x
Use == x + x
Step == x' = x + 1
====
