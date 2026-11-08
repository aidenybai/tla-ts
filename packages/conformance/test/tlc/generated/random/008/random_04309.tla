(*---
description: Evaluates a random set expression, seed 262, number 4309.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04309 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> ((\E b6791 \in 2..1 : FALSE) % (7 % -1)), b |-> [a |-> (3 % 1), b |-> (1 \in Nat)]] \cap ([[[a |-> 1] EXCEPT !.a = 2] EXCEPT !.a = ([a |-> 1] :> 7)] \cup {(7 \div 2147483647), (2 * 3)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04309 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
