(*---
description: Evaluates a random bool expression, seed 262, number 8936.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08936 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a < [[Len(<<3, 1, 2>>) EXCEPT ![(1 + 1)] = (-1 + 3)] EXCEPT ![((1 - 2) % CASE TRUE -> -1 [] OTHER -> -1)] = IF (FALSE <=> TRUE) THEN ([x \in 1..2 |-> x])[3] ELSE IF [a |-> 1, b |-> TRUE] THEN 2 ELSE 3]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08936 failed.
    Attempted to apply EXCEPT construct to the value 3.
---*)
