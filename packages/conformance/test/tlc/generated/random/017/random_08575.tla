(*---
description: Evaluates a random seq expression, seed 262, number 8575.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08575 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([[[a |-> 1, b |-> FALSE] EXCEPT ![1] = (-1 * 1)] EXCEPT ![1] = ([[a |-> 1] EXCEPT !.a = 3]).a], (((7 \div 2147483647) + (<<>> \div 2147483647)) % (CHOOSE b13289 \in {2147483647, 2147483647} : (b13289 = 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08575 failed.
    Attempted to access record by a non-string argument: 1
---*)
