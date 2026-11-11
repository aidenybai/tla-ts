(*---
description: Evaluates a random int expression, seed 262, number 3331.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03331 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((1..3 \cap {1, 2}) = (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)) -> ((7 * 0) + ([a |-> 1, b |-> TRUE]).a) [] OTHER -> {IF FALSE THEN 1 ELSE 0, (2 + 2)} \div (CASE (2147483647 = 7) -> Cardinality(1..3) [] OTHER -> (<<5, 6>>)[2] * (-(-3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03331 failed.
    Attempted to check equality of the set {1, 2} with the value:
    [a |-> 2]
---*)
