(*---
description: Evaluates a random seq expression, seed 262, number 6996.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06996 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((((FALSE <=> FALSE) /\ (TRUE <=> TRUE)) /\ ((SUBSET {1} \subseteq SUBSET {1}) <=> (<<3, 1, 2>> = (1 :> 2)))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06996 failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    FALSE
---*)
