(*---
description: A constant-level operator used as Init is refused during startup, with a different code.
ref: tlc2/tool/impl/Spec.java#getInitStateSpec
outcome: config-error
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE non_boolean_operator_as_init ----
VARIABLE x
D == 3
Init == D
Next == x' = x
====

(*--- recorded
all:
  exit: 151
  transcript: 2233:1 The initial predicate Init cannot be a constant.
---*)
