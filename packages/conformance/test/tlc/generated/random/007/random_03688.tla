(*---
description: Evaluates a random function expression, seed 262, number 3688.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03688 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([DOMAIN (LET b5823 == 2147483647 IN 1 :> (CHOOSE b5824 \in 2..1 : TRUE)) EXCEPT ![CASE ([a |-> 0, b |-> <<3, 1, 2>>] = [a |-> 3, b |-> FALSE]) -> Head(SelectSeq(<<>>, LAMBDA e : e > 0)) [] OTHER -> CASE (7 < 7) -> CASE FALSE -> 3 [] OTHER -> 1 [] OTHER -> (1 * 0)] = Cardinality((DOMAIN [x \in Nat |-> x + 1] \ {b5825 : b5825 \in {1}}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03688 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 58 to line 14, col 85 of module random_03688
---*)
