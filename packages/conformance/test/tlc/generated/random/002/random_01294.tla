(*---
description: Evaluates a random int expression, seed 262, number 1294.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01294 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-IF ((<<1>> = [x \in 1..2 |-> x]) \/ ({} <=> TRUE)) THEN (SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) - (CHOOSE b2061 \in SUBSET {1} : FALSE)) ELSE Cardinality(({1} \subseteq SUBSET {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01294 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 55 to line 14, col 65 of module random_01294
---*)
