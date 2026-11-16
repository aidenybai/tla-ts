(*---
description: Evaluates a random record expression, seed 262, number 5412.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05412 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((IF TRUE THEN 2 ELSE -1 :> Cardinality({1, 2})))[((<<5, 6>> @@ [x \in 1..2 |-> x]) % (<<>>).a)] EXCEPT !.a = (Cardinality(((1 :> 2) .. 1)) \div ([[x \in Nat |-> x + 1] EXCEPT ![2] = 3])[Len(<<>>)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05412 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 17 to line 14, col 112 of module random_05412
---*)
