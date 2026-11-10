(*---
description: "FcnLambdaValue scans its excepts from the last, so the last clause on a key wins."
ref: "tlc2/value/impl/FcnLambdaValue.java#apply"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_function_last_clause_wins ----
EXTENDS Integers
Test == [[x \in Nat |-> 0] EXCEPT ![1] = 1, ![1] = 2][1] = 2
====

(*--- recorded
all:
  exit: 0
---*)
