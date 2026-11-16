(*---
description: Evaluates a random bool expression, seed 262, number 3845.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03845 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> (CASE TRUE -> 3 [] OTHER -> 3 \div IF FALSE THEN 1 ELSE -1), b |-> ((CHOOSE b6059 \in 1..3 : FALSE) \in (-1 .. -1))] = [[a |-> IF <<1>> THEN 0 ELSE -1, b |-> (TRUE /\ FALSE)] EXCEPT !.a = (Len(<<1>>) % (7 \div 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03845 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 93 to line 14, col 121 of module random_03845
---*)
