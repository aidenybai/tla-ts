(*---
description: Evaluates a random function expression, seed 262, number 4270.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04270 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b6724 == (-1) IN ([x \in 1..2 |-> x])[<<3, 1, 2>>] :> ((7 \cup <<3, 1, 2>>) \subseteq [[a |-> 1] EXCEPT !.a = -1])) @@ [b6725 \in {(3 % 2147483647), (2147483647 \div 1)} |-> ([a |-> b6725, b |-> TRUE] - (7 % FALSE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04270 failed.
    Attempted to check if the value:
    <<3, 1, 2>>
    is in the integer interval 1..2
---*)
