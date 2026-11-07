(*---
description: Evaluates a random bool expression, seed 262, number 1775.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01775 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({b2811 \in [a |-> 3, b |-> FALSE] : (TRUE /\ FALSE)} \subseteq DOMAIN (7 :> {1})) /\ (\A b2812 \in ({3, 3} \ DOMAIN FALSE) : ((SUBSET {1} \ 1..3) \subseteq {b2812, 3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01775 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    [a |-> 3, b |-> FALSE]
    is not enumerable
---*)
