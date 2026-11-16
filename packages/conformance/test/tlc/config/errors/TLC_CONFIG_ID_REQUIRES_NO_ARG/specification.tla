(*---
description: "A name with arguments can't be used here: SPECIFICATION A."
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: config-error
config: |
  SPECIFICATION A
---*)
---- MODULE specification ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Sp == Init /\ [][Next]_x
A(p) == x = p
====

(*--- recorded
all:
  exit: 151
  transcript: 2228:1 TLC requires A not to take any argument.
---*)
