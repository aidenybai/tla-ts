(*---
description: Evaluates a random bool expression, seed 262, number 7117.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07117 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = ([[a |-> 1] EXCEPT !.a = @ + -1]).a] = [b10931 \in ((Nat \cup {}) \ UNION {{2, 1, 3}, {1, 2}}) |-> CASE (7 = b10931) -> Cardinality(1..3) [] OTHER -> LET b10932 == 7 IN b10932]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07117 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
