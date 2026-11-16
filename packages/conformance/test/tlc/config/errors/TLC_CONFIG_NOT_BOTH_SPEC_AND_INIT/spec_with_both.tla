(*---
description: SPECIFICATION with both INIT and NEXT is rejected.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: config-error
config: |
  INIT Init
  NEXT Next
  SPECIFICATION Spec
---*)
---- MODULE spec_with_both ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Spec == Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: 2227:1 The configuration file cannot specify both INIT/NEXT and SPECIFICATION fields.
---*)
