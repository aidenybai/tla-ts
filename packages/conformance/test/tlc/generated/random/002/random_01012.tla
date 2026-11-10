(*---
description: Evaluates a random record expression, seed 262, number 1012.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01012 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (-0), b |-> ([a |-> 1] = [a |-> 1])] EXCEPT !.a = @ + LET b1626 == (TRUE => FALSE) IN ([x \in 1..2 |-> x])[2]] EXCEPT !.a = @ + ((Head(<<1, 2>>) :> (-1 + -1)))[(CHOOSE b1627 \in UNION {{2, 1, 3}, (1 :> 2)} : (TRUE => TRUE))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01012 failed.
    Attempted to compare the function <<2>> with the value:
    {1, 2, 3}
---*)
