(*---
description: Evaluates a random bool expression, seed 262, number 7957.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07957 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b12283 \in {7, 7} |-> ([a |-> 1, b |-> TRUE] * 2147483647)])[(-IF TRUE THEN 1 ELSE 2147483647)] < IF ((FALSE /\ {1}) => {7, TRUE}) THEN (((1 :> 2) @@ [x \in Nat |-> x + 1]))[Cardinality(SUBSET {1})] ELSE Len(Append(<<1>>, 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07957 failed.
    In applying the function
    [b12283 \in {7} |-> <expression line 14, col 42 to line 14, col 75 of module random_07957>],
    the first argument is:
    -1
    which is not in its domain.
---*)
