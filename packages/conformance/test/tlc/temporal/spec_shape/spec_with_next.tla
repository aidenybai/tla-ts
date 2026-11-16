(*---
description: 'SPECIFICATION together with NEXT alone is rejected the same way as with INIT.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  NEXT Next
---*)
---- MODULE spec_with_next ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Spec == Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: 2227:1 The configuration file cannot specify both INIT/NEXT and SPECIFICATION fields.
---*)
