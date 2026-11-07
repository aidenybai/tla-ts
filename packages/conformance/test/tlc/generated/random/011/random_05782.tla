(*---
description: Evaluates a random int expression, seed 262, number 5782.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05782 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b8910 \in {-1, 1} : (FALSE \/ TRUE)) * ((2147483647 * 3) * Cardinality(SUBSET {1}))) * [[a |-> LET b8911 == 7 IN b8911, b |-> (\A b8912 \in {x \in 1..3 : x > 1} : FALSE)] EXCEPT !.a = (([a |-> 1]).a * Cardinality(1..3))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*3
    2178:0 Overflow when computing 2147483647*3
---*)
