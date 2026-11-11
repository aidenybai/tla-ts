(*---
description: Evaluates a random function expression, seed 262, number 4564.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04564 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + Len(<<1, 2>>)]).a .. Cardinality(({0, 2} \cap (1 \cap {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04564 failed.
    Attempted to check if the value:
    1
    is an element of the integer 1
---*)
