(*---
description: Evaluates a random set expression, seed 262, number 8070.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08070 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CHOOSE b12469 \in (IF TRUE THEN 0 ELSE 1 .. Cardinality([a |-> 1, b |-> TRUE])) : ({b12469, b12469} = {b12469, 7})), (LET b12470 == (2 - [x \in Nat |-> x + 1]) IN IF FALSE THEN b12470 ELSE b12470 \div IF (2147483647 \in {1}) THEN (-1 - 0) ELSE (2 + 0))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08070 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 18 to line 14, col 131 of module random_08070
---*)
