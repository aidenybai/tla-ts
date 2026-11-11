(*---
description: "@ of the outer EXCEPT is in scope in an inner EXCEPT's base."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
flags: [expression]
outcome: success
---*)
---- MODULE at_in_inner_base ----
Test == [<<<<1>>>> EXCEPT ![1] = [@ EXCEPT ![1] = 2]] = <<<<2>>>>
====

(*--- recorded
all:
  exit: 0
---*)
