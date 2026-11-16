(*---
description: Evaluates a random bool expression, seed 262, number 2678.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02678 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) /\ (FALSE /\ FALSE)) \/ ((0 \div 3) = Len(<<1>>))) \/ (({b4233 \in SUBSET {1} : TRUE} \cap {b4234 \in Nat : TRUE}) = {b4235 \in ({x \in 1..3 : x > 1} \ 2..1) : (b4235 = 2)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02678 failed.
    Cannot decide if element:
    {}
     is element of:
    Nat
    and satisfies the predicate line 14, col 175 to line 14, col 178 of module random_02678
---*)
