(*---
description: Evaluates a random int expression, seed 262, number 2617.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02617 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : 2..1] : TRUE)).a \div (LET b4120 == Cardinality(FALSE) IN LET b4121 == b4120 IN 7 - (CHOOSE b4122 \in ({} \cup 1..3) : (SUBSET {1} \subseteq SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02617 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 48 of module random_02617
---*)
