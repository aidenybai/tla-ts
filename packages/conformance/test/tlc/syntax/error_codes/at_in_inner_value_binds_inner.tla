(*---
description: "@ in an inner EXCEPT value binds to the innermost."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
flags: [expression]
outcome: success
---*)
---- MODULE at_in_inner_value_binds_inner ----
Test == [<<<<1>>>> EXCEPT ![1] = [@ EXCEPT ![1] = @]] = <<<<1>>>>
====

(*--- recorded
all:
  exit: 0
---*)
