(*---
description: Evaluates a random record expression, seed 262, number 1877.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01877 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> CASE TRUE -> 7 [] OTHER -> 7, b |-> (TRUE \/ FALSE)] EXCEPT !.a = (CASE TRUE -> 0 [] OTHER -> 0 % ([a |-> 1, b |-> TRUE]).a)] EXCEPT !.a = @ + (((3 \div 3) :> LET b2954 == 2147483647 IN b2954))[((CHOOSE f \in [{1, 2} -> {}] : TRUE))[Len(<<1, 2>>)]]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01877 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 221 to line 14, col 254 of module random_01877
---*)
