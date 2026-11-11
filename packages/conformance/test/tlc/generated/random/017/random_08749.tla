(*---
description: Evaluates a random record expression, seed 262, number 8749.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08749 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Len([a |-> 2147483647, b |-> FALSE]), b |-> ([2 EXCEPT !.a = 1] = (CHOOSE b13545 \in 2..1 : TRUE))] EXCEPT !.a = @ + LET b13546 == Head(<<-1, 2147483647>>) IN LET b13547 == (b13546 + b13546) IN (b13547 - b13547)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08749 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 2147483647, b |-> FALSE]
---*)
