(*---
description: Evaluates a random record expression, seed 262, number 8447.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08447 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = @ + -1] EXCEPT !.a = @ + Cardinality(SUBSET {1})] EXCEPT !.a = ((7 \div 2147483647) :> (0 - 0))] EXCEPT !.a = ((([x \in 1..2 |-> x] @@ <<5, 6>>))[(7 * 2)] - (([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]))[(0 \div 0)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08447 failed.
    Attempted to apply function:
    <<1, 2>>
    to argument 14, which is not in the domain of the function.
---*)
