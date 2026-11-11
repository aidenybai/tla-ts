(*---
description: An INVARIANT with parameters is a config error.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInvariants
outcome: config-error
config: |
  INIT Init
  NEXT Next
  INVARIANT Inv
---*)
---- MODULE parameterized ----
EXTENDS Naturals, TLC
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Inv(v) == v
====

(*--- recorded
all:
  exit: 151
  transcript: "2228:1 TLC requires invariant not to take any argument, but one was given: Inv"
---*)
