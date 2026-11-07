(*---
description: Evaluates a random set expression, seed 262, number 5497.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05497 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b8498 \in 1..3 : FALSE) + Head(<<1, 2>>)) .. LET b8499 == (2147483647 \div 2147483647) IN Cardinality(7)) \cup DOMAIN [((1 :> 2) @@ [x \in Nat |-> x + 1]) EXCEPT ![(CHOOSE b8500 \in Nat : FALSE)] = (CHOOSE b8501 \in 2..1 : TRUE)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05497 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 48 of module random_05497
---*)
