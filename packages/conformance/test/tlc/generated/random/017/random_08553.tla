(*---
description: Evaluates a random bool expression, seed 262, number 8553.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08553 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1]).a < Head(<<1>>)) => (Append(<<1, 2>>, 7) = (CHOOSE f \in [{0} \cup {1} -> {2, 1, 3}] : TRUE))) <=> ((({x \in 1..3 : x > 1} \ 2..1) = (SUBSET {1} \cap Nat)) => (CHOOSE b13256 \in (<<>> \cap {}) : (TRUE \/ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08553 failed.
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
---*)
