(*---
description: Evaluates a random record expression, seed 262, number 4314.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04314 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Cardinality({b6800 : b6800 \in {1}}) + (LET b6801 == 1 IN b6801 * (1 % 2))), b |-> ({b6802 \in (1..3 \ {x \in 1..3 : x > 1}) : (-1 < b6802)} \subseteq {(7 + -1), (0 \div 0)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04314 failed.
    2179:0 The second argument of \div is 0.
---*)
