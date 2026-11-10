(*---
description: Evaluates a random int expression, seed 262, number 5851.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05851 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b9027 == (IF (~TRUE) THEN (-1) ELSE Cardinality(1..3) - (((1 :> 2))[2147483647] % ([a |-> 1]).a)) IN ((-((1 :> 2))[b9027]) + Cardinality(DOMAIN [x \in 1..2 |-> x])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05851 failed.
    Attempted to apply function:
    <<2>>
    to argument 2147483647, which is not in the domain of the function.
---*)
