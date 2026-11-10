(*---
description: Evaluates a random seq expression, seed 262, number 3080.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03080 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq([SubSeq(<<5, 6>>, 3, 3) EXCEPT ![1] = CASE TRUE -> -1 [] OTHER -> 2147483647], (([a |-> 1, b |-> TRUE]).a + Cardinality({2, 1, 3})), ((<<5, 6>>)[1] * Cardinality(SUBSET {1}))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03080 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<5, 6>>
    , but instead it is
    3
---*)
