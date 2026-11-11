(*---
description: Evaluates a random function expression, seed 262, number 7989.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07989 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([b12338 \in ({} \cap {1}) |-> (<<5, 6>>)[1]] @@ [((1 :> 2) @@ <<5, 6>>) EXCEPT ![(-2147483647)] = (2 \div 0)]) @@ (((1 - -1) - (2147483647 * 7)) :> IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN ([a |-> 1]).a ELSE CASE FALSE -> 2 [] OTHER -> 2)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 68 to line 14, col 87 of module random_07989
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07989 failed.
    2178:0 Overflow when computing 2147483647*7
---*)
