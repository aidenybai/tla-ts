(*---
description: Evaluates a random function expression, seed 262, number 4987.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04987 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7766 \in {((b7767 :> 0))[(b7767 * b7767)] : b7767 \in (Len(<<1, 2>>) .. (2 * 7))} |-> Cardinality(DOMAIN [[x \in 1..2 |-> x] EXCEPT ![1] = 2147483647])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04987 failed.
    Attempted to apply function:
    (2 :> 0)
    to argument 4, which is not in the domain of the function.
---*)
