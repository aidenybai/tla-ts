(*---
description: Evaluates a random function expression, seed 262, number 7065.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07065 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 + 3) * Cardinality({x \in 1..3 : x > 1})) \div (LET b10853 == 2147483647 IN 0 * Cardinality(SUBSET {1}))) :> (CASE (~FALSE) -> ([x \in 1..2 |-> x])[0] [] OTHER -> ([x \in 1..2 |-> x])[-1] + CASE (TRUE \/ FALSE) -> (CHOOSE b10854 \in SUBSET {1} : TRUE) [] OTHER -> Head(<<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
