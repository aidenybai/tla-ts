(*---
description: A spec whose conjunct is constantly FALSE is trivial.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
outcome: config-error
config: |
  SPECIFICATION Sp
---*)
---- MODULE false_conjunct ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
K == FALSE
Sp == Init /\ K /\ [][Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: 2237:1 The spec is trivially false because K is false.
---*)
