(*---
description: A quoted invariant name keeps its quotes, so it can't match the definition called Inv.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: config-error
config: |
  INIT Init
  NEXT Next
  INVARIANT "Inv"
---*)
---- MODULE invariant_named_by_string ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv == TRUE
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The invariant "Inv" specified in the configuration file
    is not defined in the specification.
---*)
