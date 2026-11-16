(*---
description: Evaluates a random bool expression, seed 262, number 2795.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02795 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((DOMAIN -1 \cup (\E b4428 \in 1..3 : TRUE)) = {b4429 \in (2..1 \cup 2..1) : (~FALSE)}) \/ (((3 :> 3) => (TRUE <=> FALSE)) <=> (\E b4430 \in (<<>> \cap {x \in 1..3 : x > 1}) : (TRUE => FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02795 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (an integer)
    line 14, col 19 to line 14, col 27 of module random_02795
---*)
