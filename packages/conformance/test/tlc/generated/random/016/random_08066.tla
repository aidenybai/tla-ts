(*---
description: Evaluates a random record expression, seed 262, number 8066.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08066 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (3 % 7), b |-> (<<>> = [x \in Nat |-> x + 1])] EXCEPT !.a = @ + Head((<<3, 1, 2>> \o <<3, 1, 2>>))] EXCEPT !.a = (-(Head(<<1, 2>>) - (3 - 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08066 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
