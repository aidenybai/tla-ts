(*---
description: Evaluates a random set expression, seed 262, number 4904.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04904 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {DOMAIN SubSeq(TRUE, -1, 0), {b7635 \in (1 \in FALSE) : (<<>> = [x \in 1..2 |-> x])}} \cup ({b7636 \in {7, 1} : (Nat \subseteq {})} \cap ((SUBSET {1} \ {1}) \ (FALSE \cup Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04904 failed.
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    TRUE
---*)
