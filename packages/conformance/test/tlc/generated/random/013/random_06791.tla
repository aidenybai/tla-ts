(*---
description: Evaluates a random function expression, seed 262, number 6791.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06791 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality((DOMAIN [x \in 1..2 |-> x] \ {b10417 : b10417 \in 2..1})) :> Head(SubSeq(Append(<<>>, 0), (-1 - 1), (SUBSET {1} \cup 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06791 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    1..3 \cup {{}, {1}}
---*)
