(*---
description: Evaluates a random bool expression, seed 262, number 5599.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05599 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({1, 2} \cup {1, 2}) \ (SUBSET {1} \cap {1, 2})) \subseteq ((SUBSET {1} \cap 2..1) \cap (<<1, 2>> \cup {2, 1, 3}))) \/ ((\A b8667 \in ({1, 2} \cup Nat) : (\E b8668 \in {} : FALSE)) \/ (~(CHOOSE r \in [a : {2, 1, 3}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05599 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
