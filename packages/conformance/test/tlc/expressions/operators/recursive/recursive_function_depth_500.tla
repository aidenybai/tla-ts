(*---
description: "A recursive function reaches a depth of 500 applications."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE recursive_function_depth_500 ----
EXTENDS Integers
F[n \in Nat] == IF n = 0 THEN 0 ELSE 1 + F[n - 1]
Test == F[500] = 500
====

(*--- recorded
all:
  exit: 0
---*)
