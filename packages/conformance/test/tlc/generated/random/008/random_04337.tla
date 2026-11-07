(*---
description: Evaluates a random bool expression, seed 262, number 4337.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04337 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Append(<<1>>, -1) \o Tail(<<1, 2>>)) = [b6830 \in {TRUE : b6831 \in {}} |-> Cardinality(TRUE)]) \/ ((([x \in Nat |-> x + 1])[0] + (-1)) = ((-1 :> 2) @@ ([x \in 1..2 |-> x] @@ {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    {1}
    2169:0 The second argument of @@ should be a function, but instead it is:
    {1}
---*)
