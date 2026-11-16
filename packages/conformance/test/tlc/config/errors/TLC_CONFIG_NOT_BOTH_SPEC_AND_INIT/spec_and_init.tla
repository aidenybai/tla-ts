(*---
description: SPECIFICATION with INIT is rejected.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: config-error
config: |
  SPECIFICATION Spec
  INIT Init
---*)
---- MODULE spec_and_init ----
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
