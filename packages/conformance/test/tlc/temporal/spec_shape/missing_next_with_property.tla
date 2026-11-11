(*---
description: 'A temporal property without a next-state relation fails early with TLC_CONFIG_MISSING_NEXT.'
ref: tlc2/tool/impl/SpecProcessor.java#processSpec
features: [liveness]
outcome: config-error
config: |
  SPECIFICATION Spec
  PROPERTY Prop
---*)
---- MODULE missing_next_with_property ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x < 2 /\ x' = x + 1
Spec == Init
Prop == <>(x = 0)
====

(*--- recorded
all:
  exit: 151
  transcript: 2232:1 The configuration file did not specify the next state predicate.
---*)
