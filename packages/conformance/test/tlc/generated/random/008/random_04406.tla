(*---
description: Evaluates a random function expression, seed 262, number 4406.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04406 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6933 \in UNION {{(0 + -1), ((1 :> 2))[0]}, {(2 \div 1), Cardinality({x \in 1..3 : x > 1})}} |-> Head(SelectSeq([a |-> b6933, b |-> FALSE], LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04406 failed.
    Attempted to apply function:
    <<2>>
    to argument 0, which is not in the domain of the function.
---*)
