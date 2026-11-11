(*---
description: Evaluates a random record expression, seed 262, number 8202.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08202 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (Len(<<1>>) * (1 * 3)), b |-> (([a |-> 1]).a < ([a |-> 1, b |-> TRUE]).a)] EXCEPT !.a = @ + IF (~DOMAIN [x \in 1..2 |-> x]) THEN Cardinality(({1} \cup 1..3)) ELSE Cardinality((2 .. 1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08202 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a set of the form i..j)
    line 14, col 120 to line 14, col 145 of module random_08202
---*)
