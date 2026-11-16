(*---
description: Evaluates a random set expression, seed 262, number 3433.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03433 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((([x \in Nat |-> x + 1] < 0) <=> ([a |-> 1] = [a |-> 1, b |-> TRUE])) \cup DOMAIN (CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE)), <<(CHOOSE b5439 \in (~FALSE) : (-1 \in SUBSET {1})), LET b5440 == Cardinality(1..3) IN (CHOOSE b5441 \in Nat : FALSE)>>})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03433 failed.
    2266:0 The first argument of < should be an integer, but instead it is:
    [x \in Nat |-> <expression line 14, col 41 to line 14, col 45 of module random_03433>]
---*)
