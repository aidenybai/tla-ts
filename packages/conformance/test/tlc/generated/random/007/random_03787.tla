(*---
description: Evaluates a random set expression, seed 262, number 3787.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03787 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [<<(-1 - 1), Cardinality({2, 1, 3})>> EXCEPT ![CASE ([a |-> 1]).a -> (3 + 1) [] OTHER -> CASE FALSE -> 7 [] OTHER -> 2147483647] = (-(CHOOSE b5975 \in 2147483647 : FALSE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03787 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. line 14, col 75 to line 14, col 87 of module random_03787
---*)
