(*---
description: 'A SPECIFICATION definition overridden with a plain value is rejected as having that value.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  CONSTANT Spec = 3
---*)
---- MODULE spec_name_overridden_with_value ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Spec == Init /\ [][Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: 2230:1 The value of Spec is equal to 3
---*)
