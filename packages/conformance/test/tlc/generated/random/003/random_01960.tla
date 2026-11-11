(*---
description: Evaluates a random seq expression, seed 262, number 1960.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01960 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(Len([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]) % LET b3093 == IF TRUE THEN -1 ELSE 0 IN (CHOOSE b3094 \in {1, 2} : FALSE)), Cardinality({b3095 \in ({1, 2} \cap {1, 2}) : (-1 \in 1..3)})>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01960 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 0, b |-> TRUE]
---*)
