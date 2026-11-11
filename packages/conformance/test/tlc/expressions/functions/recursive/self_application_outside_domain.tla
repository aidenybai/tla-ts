(*---
description: "Recursion that leaves the domain reports the lazy function message. Only the assume context is pinned: building that message calls toString, which enumerates the function and fails again until the stack overflows, so the call stack the other contexts print has a length that changes from run to run."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
contexts: [assume]
outcome: evaluation-failure
---*)
---- MODULE self_application_outside_domain ----
EXTENDS Integers
F[n \in 0..2] == IF n = 0 THEN 0 ELSE F[n - 2]
Test == F[1] = 0
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 12, col 8 to line 12, col 11 of module self_application_outside_domain failed.
    In applying the function
    [n \in 0..2 |-> <expression line 10, col 18 to line 10, col 46 of module self_application_outside_domain>],
    the first argument is:
    -1
    which is not in its domain.
---*)
