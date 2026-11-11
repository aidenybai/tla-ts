(*---
description: Evaluates a random record expression, seed 262, number 3106.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03106 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((<<5, 6>>)[-1] % Head(<<3, 1, 2>>)), b |-> ((TRUE \/ FALSE) = (CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE))] EXCEPT !.a = @ + Head(SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), Head(<<>>), Head(<<1>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03106 failed.
    Attempted to access index -1 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
