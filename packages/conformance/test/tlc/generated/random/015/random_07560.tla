(*---
description: Evaluates a random record expression, seed 262, number 7560.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07560 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-((CHOOSE b11641 \in {2, 1, 3} : [a |-> 1, b |-> TRUE]) * ([x \in Nat |-> x + 1])[2])), b |-> (~(~(~FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07560 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 27 to line 14, col 77 of module random_07560
---*)
