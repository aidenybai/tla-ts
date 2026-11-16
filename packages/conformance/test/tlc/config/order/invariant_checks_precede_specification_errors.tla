(*---
description: processConfig handles invariants before the specification, so an undefined invariant is reported ahead of an undefined SPECIFICATION.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: config-error
config: |
  SPECIFICATION NoSpec
  INVARIANT NoInv
---*)
---- MODULE invariant_checks_precede_specification_errors ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: |-
    2229:1 The invariant NoInv specified in the configuration file
    is not defined in the specification.
---*)
