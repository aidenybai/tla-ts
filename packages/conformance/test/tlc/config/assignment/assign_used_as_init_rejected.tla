(*---
description: A definition assigned a value is no longer an operator, so INIT can't name it.
ref: tlc2/tool/impl/SpecProcessor.java#processConfigInitAndNext
outcome: config-error
config: |
  INIT Init
  NEXT Next
  CONSTANT Init = TRUE
---*)
---- MODULE assign_used_as_init_rejected ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 151
  transcript: 2233:1 The initial predicate Init cannot be a constant.
---*)
