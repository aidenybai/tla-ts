(*---
description: Evaluates a random function expression, seed 262, number 197.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00197 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b325 \in {1} : [x \in 1..2 |-> x]) \div (-0)) :> Head([[a |-> 1, b |-> TRUE] EXCEPT ![1] = 2])) @@ [SortSeq([(1 :> 2) EXCEPT ![0] = -1], LAMBDA p, q : p < q) EXCEPT ![1] = ((2 % 2147483647) \div LET b326 == -1 IN b326)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00197 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 20 to line 14, col 59 of module random_00197
---*)
