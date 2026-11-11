(*---
description: Evaluates a random set expression, seed 262, number 5725.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05725 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(<<Head(<<>>), (b8805 % 2)>>) : b8805 \in (({b8806 \in {2, 1, 3} : TRUE} \cup ({1, 2} \cup Nat)) \cap (LET b8807 == 2 IN 0 .. (2 + 1)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05725 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
