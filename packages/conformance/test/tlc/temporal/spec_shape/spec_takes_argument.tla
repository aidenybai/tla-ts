(*---
description: 'A SPECIFICATION operator with a parameter fails with TLC_CONFIG_ID_REQUIRES_NO_ARG.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
---*)
---- MODULE spec_takes_argument ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1

Spec(n) == x = n /\ [][Next]_x
====

(*--- recorded
all:
  exit: 151
  transcript: 2228:1 TLC requires Spec not to take any argument.
---*)
