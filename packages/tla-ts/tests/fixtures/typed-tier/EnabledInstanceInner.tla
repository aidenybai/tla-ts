---- MODULE EnabledInstanceInner ----
EXTENDS Naturals
VARIABLES x, y
F == ENABLED (x' = 0 /\ y' = 1)
G == ENABLED (x # y /\ x' = 0 /\ y' = 1)
Init == x = 0 /\ y = 0
====
