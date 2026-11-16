(*---
description: Evaluates a random function expression, seed 262, number 5826.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05826 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((\A b8985 \in 1..3 : FALSE) \/ (0 \in Nat)) <=> ([a |-> 3, b |-> TRUE] => (3 = FALSE))) <=> (((Nat = SUBSET {1}) \/ (Nat = {x \in 1..3 : x > 1})) \/ ((SUBSET {1} = [a |-> 1]) => (TRUE \/ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05826 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a record.
    line 14, col 68 to line 14, col 103 of module random_05826
---*)
