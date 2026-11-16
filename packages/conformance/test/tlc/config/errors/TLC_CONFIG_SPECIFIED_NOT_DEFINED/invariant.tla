(*---
description: An undefined INVARIANT is called an invariant.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: config-error
config: |
  INIT Init
  NEXT Next
  INVARIANT Nope
---*)
---- MODULE invariant ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The invariant Nope specified in the configuration file
    is not defined in the specification.
---*)
