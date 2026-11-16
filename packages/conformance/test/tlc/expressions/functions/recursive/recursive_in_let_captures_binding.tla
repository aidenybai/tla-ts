(*---
description: "A recursive function in LET sees the enclosing binder."
ref: "tlc2/value/impl/FcnLambdaValue.java#makeRecursive"
flags: [expression]
outcome: success
---*)
---- MODULE recursive_in_let_captures_binding ----
EXTENDS Integers
Test == \A k \in 1..2 : LET F[n \in 0..1] == IF n = 0 THEN k ELSE F[n - 1] + 1 IN F[1] = k + 1
====

(*--- recorded
all:
  exit: 0
---*)
