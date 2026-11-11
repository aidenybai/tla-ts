(*---
description: Evaluates a random int expression, seed 262, number 1149.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01149 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality((Head(<<1, 2>>) .. ([x \in Nat |-> x + 1])[2147483647])) - (CHOOSE b1840 \in ((1..3 \cup {x \in 1..3 : x > 1}) \cap (2..1 \cap {1, 2})) : (\E b1841 \in UNION {{2, 1, 3}, [a |-> 1]} : (FALSE <=> TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01149 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
