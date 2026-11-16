(*---
description: A temporal property needs a next-state action.
ref: tlc2/tool/impl/SpecProcessor.java#processConfig
outcome: config-error
config: |
  SPECIFICATION Sp
  PROPERTY Prop
---*)
---- MODULE property_no_next ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
Sp == Init
Prop == [](x = 0)
====

(*--- recorded
all:
  exit: 151
  transcript: 2232:1 The configuration file did not specify the next state predicate.
---*)
