(*---
description: Evaluates a random set expression, seed 262, number 8235.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08235 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3] EXCEPT !.a = @ + ([x \in 1..2 |-> x])[3]]).a, IF ((3 \in 2..1) <=> (3 < 7)) THEN (Cardinality({}) * Cardinality({})) ELSE ((-1 \div 0) * IF TRUE THEN -1 ELSE 3)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08235 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
