(*---
description: Evaluates a random bool expression, seed 262, number 7647.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07647 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<Head(Tail(<<>>)), ([a |-> 0, b |-> TRUE]).a>> = ([b11770 \in (1..3 \cup {x \in 1..3 : x > 1}) |-> LET b11771 == 0 IN b11771] @@ (CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07647 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
