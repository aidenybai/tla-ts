(*---
description: Evaluates a random bool expression, seed 262, number 8986.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08986 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(\A b13949 \in {(CHOOSE b13951 \in {2, 1, 3} : TRUE) : b13950 \in (SUBSET {1} \ {x \in 1..3 : x > 1})} : ((FALSE \/ FALSE) => (b13949 = 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08986 failed.
    Attempted to compare the set {} with the value:
    3
---*)
