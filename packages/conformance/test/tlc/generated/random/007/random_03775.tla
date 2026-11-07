(*---
description: Evaluates a random bool expression, seed 262, number 3775.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03775 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = (7 - 3)] EXCEPT !.a = CASE IF FALSE THEN -1 ELSE 0 -> ([x \in Nat |-> x + 1])[2147483647] [] OTHER -> (7 \div 7)] = (CHOOSE r \in [a : {}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03775 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. line 14, col 91 to line 14, col 113 of module random_03775
---*)
