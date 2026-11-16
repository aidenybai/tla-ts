(*---
description: Evaluates a random seq expression, seed 262, number 25.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00025 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail([Tail(<<>>) EXCEPT ![1] = (2147483647 % 2)]), (((3 :> 2147483647) @@ (7 :> 2147483647)))[([b34 \in {1, 2} |-> -1])[(2 * 1)]], Head(Tail((TRUE <=> FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00025 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
