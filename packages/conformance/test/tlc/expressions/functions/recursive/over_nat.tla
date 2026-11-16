(*---
description: "A recursive function can range over Nat because it is never enumerated."
ref: "tlc2/value/impl/FcnLambdaValue.java#makeRecursive"
flags: [expression]
outcome: success
---*)
---- MODULE over_nat ----
EXTENDS Integers
F[n \in Nat] == IF n = 0 THEN 0 ELSE F[n - 1] + 1
Test == F[5] = 5
====

(*--- recorded
all:
  exit: 0
---*)
