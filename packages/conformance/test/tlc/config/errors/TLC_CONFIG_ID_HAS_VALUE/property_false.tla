(*---
description: A property that is constantly FALSE is rejected.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: config-error
config: |
  SPECIFICATION Sp
  PROPERTY K
---*)
---- MODULE property_false ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Sp == Init /\ [][Next]_x
K == FALSE
I == 3
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The property of K is equal to FALSE
---*)
