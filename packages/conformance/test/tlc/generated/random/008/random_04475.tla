(*---
description: Evaluates a random set expression, seed 262, number 4475.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04475 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((UNION {{2, 1, 3}, {x \in 1..3 : x > 1}} \cap UNION {1..3, {}}) \cup Head(SelectSeq(<<>>, LAMBDA e : e > 0))) \cup ((SubSeq(<<>>, 0, -1) .. ([x \in 1..2 |-> x])[2147483647]) \cup (UNION {[a |-> 1, b |-> TRUE], {2, 1, 3}} = {(1 :> 2), 0}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04475 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
