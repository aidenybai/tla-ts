(*---
description: Evaluates a random bool expression, seed 262, number 726.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00726 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(\E b1194 \in ((SUBSET {1} \cup SUBSET {1}) \ {b1195 \in {1} : TRUE}) : (\E b1196 \in {3, b1194} : (SUBSET {1} \subseteq Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00726 failed.
    Attempted to compare the set {} with the value:
    1
---*)
