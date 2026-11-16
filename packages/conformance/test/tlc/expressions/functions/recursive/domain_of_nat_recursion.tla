(*---
description: "DOMAIN of a recursive function over Nat is Nat."
ref: "tlc2/value/impl/FcnLambdaValue.java#getDomain"
flags: [expression]
outcome: success
---*)
---- MODULE domain_of_nat_recursion ----
EXTENDS Integers
F[n \in Nat] == IF n = 0 THEN 0 ELSE F[n - 1]
Test == DOMAIN F = Nat
====

(*--- recorded
all:
  exit: 0
---*)
