(*---
description: Evaluates a random record expression, seed 262, number 8863.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08863 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + ((2 + 7) * (-2147483647))] EXCEPT !.a = Head(Append(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), Head(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08863 failed.
    2178:0 Overflow when computing 9*-2147483647
---*)
