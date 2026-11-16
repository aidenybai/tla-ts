(*---
description: "A recursive call rebinding a parameter does not disturb a lazy argument of the outer call."
ref: "tlc2/util/Context.java#lookup"
flags: [expression]
outcome: success
---*)
---- MODULE nested_rebinding_through_calls ----
EXTENDS Integers
RECURSIVE R(_, _)
R(n, v) == IF n = 0 THEN v ELSE R(n - 1, n + v)
Test == R(2, 10) = 13
====

(*--- recorded
all:
  exit: 0
---*)
