(*---
description: Evaluates a random record expression, seed 262, number 4145.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04145 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = @ + 3] EXCEPT !.a = @ + (2 - 1)] EXCEPT !.a = @ + ((1 :> 1))[(0 % 2)]] EXCEPT !.a = @ + (CHOOSE b6531 \in ((2147483647 .. 0) \cup (2147483647 .. 7)) : ((7 < 7) => (b6531 = 2147483647)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04145 failed.
    Attempted to apply function:
    <<1>>
    to argument 0, which is not in the domain of the function.
---*)
