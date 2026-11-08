(*---
description: Evaluates a random record expression, seed 262, number 9116.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09116 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 3, b |-> FALSE] EXCEPT !.a = @ + (-1 + 7)] EXCEPT !.a = @ + ((7 \div 0) * (-1 - 3))] EXCEPT !.a = ([a |-> CASE TRUE -> 1 [] OTHER -> 3, b |-> (0 < 7)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09116 failed.
    2179:0 The second argument of \div is 0.
---*)
