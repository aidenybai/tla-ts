(*---
description: Evaluates a random set expression, seed 262, number 8478.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08478 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Head(Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), (CHOOSE b13123 \in {1, 2} : FALSE))) : b13122 \in (LET b13124 == (2 \div 1) IN Head(<<3, 1, 2>>) \cap ((3 * 0) .. ({x \in 1..3 : x > 1} \ FALSE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08478 failed.
    Attempted to check if the value:
    2
    is an element of the boolean FALSE
---*)
