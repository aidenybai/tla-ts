(*---
description: Evaluates a random seq expression, seed 262, number 8062.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08062 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SortSeq(SubSeq((<<3, 1, 2>> \o [a |-> 1]), (2 + 3), (0 * {1, 2})), LAMBDA p, q : p < q), ((CHOOSE f \in [{2, 1, 3} -> {2, 1, 3}] : TRUE))[([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7]).a], (Cardinality((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)) + (CHOOSE b12456 \in (-1 .. 1) : (FALSE \/ FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08062 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    [a |-> 1]
---*)
