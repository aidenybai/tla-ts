(*---
description: Evaluates a random record expression, seed 262, number 2474.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02474 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(7 \o <<3, 1, 2>>) EXCEPT !.a = @ + IF FALSE THEN <<3, 1, 2>> ELSE FALSE] EXCEPT !.a = @ + (LET b3889 == 2 IN b3889 % ([a |-> 1]).a)] EXCEPT !.a = (((3 + <<5, 6>>) \div (-1 + 7)) :> ([(1 :> 2) EXCEPT ![0] = 0])[(-1 = 7)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02474 failed.
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    7
---*)
