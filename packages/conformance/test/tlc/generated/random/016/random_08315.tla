(*---
description: Evaluates a random set expression, seed 262, number 8315.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08315 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({IF (\A b12869 \in {1, 2} : TRUE) THEN (2147483647 - 2) ELSE Head(<<1, 2>>), Head(SubSeq(<<3, 1, 2>>, -1, 1))} \cap (((1 .. FALSE) \ ({1, 2} \ {})) \ {b12870 \in (1 .. 2147483647) : (FALSE => TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08315 failed.
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
---*)
