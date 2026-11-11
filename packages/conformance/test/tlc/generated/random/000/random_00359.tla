(*---
description: Evaluates a random record expression, seed 262, number 359.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00359 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Len(([2..1 EXCEPT ![1] = [x \in 1..2 |-> x]] \o Tail(<<1>>))) EXCEPT !.a = @ + (([<<5, 6>> EXCEPT ![3] = -1])[LET b591 == 2147483647 IN 2147483647] % (LET b592 == 7 IN -1 - (CHOOSE b593 \in 2..1 : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00359 failed.
    Attempted to apply EXCEPT construct to the value {}.
---*)
