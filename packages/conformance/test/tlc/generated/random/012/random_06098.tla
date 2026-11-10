(*---
description: Evaluates a random record expression, seed 262, number 6098.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06098 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> LET b9384 == (CHOOSE b9385 \in {1} : [a |-> 1]) IN (CHOOSE b9386 \in SUBSET {1} : FALSE), b |-> (\E b9387 \in UNION {2..1, 1..3} : ([a |-> 1] = [a |-> 1]))] EXCEPT !.a = @ + (-(((1 :> 2))[2] \div (-3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06098 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 76 to line 14, col 110 of module random_06098
---*)
