(*---
description: Evaluates a random function expression, seed 262, number 4191.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04191 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SelectSeq(Tail(<<>>), LAMBDA e : e > 0)) :> (CHOOSE b6597 \in (UNION {{x \in 1..3 : x > 1}, {2, 1, 3}} \cap (2147483647 % 2147483647)) : ((<<1>> = [x \in 1..2 |-> x]) \/ (SUBSET {1} \subseteq 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04191 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
