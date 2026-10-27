---- MODULE Step ----
EXTENDS Naturals
CONSTANT step
VARIABLE count
StepNext == count' = (count + step) % 4
====
