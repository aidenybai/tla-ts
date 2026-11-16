(*---
description: Evaluates a random seq expression, seed 262, number 144.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00144 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq([Tail(<<>>) EXCEPT ![1] = (3 - 0)], LAMBDA p, q : p < q), (CHOOSE b224 \in DOMAIN (CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE) : (~({1, 2} = {x \in 1..3 : x > 1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00144 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
