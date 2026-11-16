(*---
description: Evaluates a random function expression, seed 262, number 242.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00242 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{2, 1, 3} -> {}] : TRUE) EXCEPT ![((-([a |-> 1]).a) \div (([x \in 1..2 |-> x] @@ [x \in Nat |-> x + 1]))[((1 :> 2))[3]])] = ((IF FALSE THEN -1 ELSE 2 + CASE TRUE -> 7 [] OTHER -> 1) \div Cardinality(UNION {{1}, 1..3}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00242 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 54 of module random_00242
---*)
