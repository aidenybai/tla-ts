(*---
description: Evaluates a random bool expression, seed 262, number 4973.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04973 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b7746 == Cardinality({b7747 \in {1} : TRUE}) IN ([b7748 \in {2, 1, 3} |-> b7748])[(CHOOSE b7749 \in 2..1 : FALSE)] < ((CHOOSE b7750 \in (2..1 \cup Nat) : (TRUE \/ TRUE)) % Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04973 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 104 to line 14, col 132 of module random_04973
---*)
