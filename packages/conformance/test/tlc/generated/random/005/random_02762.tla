(*---
description: Evaluates a random bool expression, seed 262, number 2762.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02762 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(Tail((CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE)), LAMBDA e : e > 0) = [((0 :> 1..3) @@ LET b4357 == 2 IN b4357) EXCEPT ![(LET b4358 == 0 IN b4358 % ([x \in 1..2 |-> x])[2147483647])] = (Len([x \in Nat |-> x + 1]) * CASE TRUE -> 2147483647 [] OTHER -> [a |-> 1, b |-> TRUE])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02762 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    (2 :> 1)
---*)
