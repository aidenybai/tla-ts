(*---
description: Evaluates a random bool expression, seed 262, number 6270.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06270 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b9652 \in {Head(SubSeq(<<1, 2>>, -1, 0)), (((1 :> 2))[2] - LET b9653 == 2147483647 IN b9653)} : (((2..1 \cap SUBSET {1}) \ DOMAIN [x \in Nat |-> x + 1]) \subseteq UNION {{2 : b9654 \in {1, 2}}, UNION {Nat, 2..1}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06270 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2>>
    , but instead it is
    -1
---*)
