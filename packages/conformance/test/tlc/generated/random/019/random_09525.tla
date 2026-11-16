(*---
description: Evaluates a random int expression, seed 262, number 9525.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09525 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((2147483647 \div 3) \in {3 : b14793 \in {}}) <=> (CASE FALSE -> {} [] OTHER -> -1 = (-1 * 2147483647))) -> Head([[a |-> -1, b |-> FALSE] EXCEPT ![1] = (CHOOSE b14794 \in 1..3 : TRUE)]) [] OTHER -> (([(1 :> 2) EXCEPT ![2147483647] = 2147483647])[CASE FALSE -> 1 [] OTHER -> 2] - ((-1 % 2147483647) \div Head(<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09525 failed.
    Attempted to access record by a non-string argument: 1
---*)
