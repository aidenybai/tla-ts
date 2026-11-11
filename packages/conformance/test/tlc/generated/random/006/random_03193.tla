(*---
description: Evaluates a random function expression, seed 262, number 3193.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03193 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((CHOOSE f \in [{1} -> {}] : TRUE) @@ ([x \in Nat |-> x + 1] @@ (1 :> 2))) EXCEPT ![(Head(<<1, 2>>) \div (0 - 3))] = (Head(<<1>>) - IF FALSE THEN 2147483647 ELSE 7)] @@ [(Len(<<1>>) :> (-[a |-> 1])) EXCEPT ![IF (TRUE \/ TRUE) THEN IF TRUE THEN 0 ELSE 0 ELSE CASE TRUE -> 3 [] OTHER -> 2] = CASE (2147483647 \in {x \in 1..3 : x > 1}) -> (2147483647 * [x \in Nat |-> x + 1]) [] OTHER -> ([a |-> 1]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03193 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 50 of module random_03193
---*)
