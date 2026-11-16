(*---
description: A spec conjunct that is a non-Boolean constant is rejected.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigSpec
outcome: config-error
config: |
  SPECIFICATION Sp
---*)
---- MODULE non_bool_conjunct ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
K == 3
Sp == Init /\ K /\ [][Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2236:1 The operator K, which equals 3,
    cannot be used as a spec
---*)
