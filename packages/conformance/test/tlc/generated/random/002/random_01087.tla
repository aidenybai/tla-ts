(*---
description: Evaluates a random bool expression, seed 262, number 1087.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01087 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(-1 \div 7) EXCEPT !.a = (<<3, 1, 2>> = [x \in 1..2 |-> x])] EXCEPT !.a = ((0 * 2147483647) * Head(<<>>))] = [[a |-> ((1 :> 2))[0], b |-> (TRUE /\ TRUE)] EXCEPT !.a = ([a |-> 2, b |-> FALSE]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01087 failed.
    Attempted to apply EXCEPT construct to the value 0.
---*)
