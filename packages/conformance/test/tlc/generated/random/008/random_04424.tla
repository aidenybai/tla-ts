(*---
description: Evaluates a random set expression, seed 262, number 4424.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04424 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} -> {0} \cup {1}] : TRUE) EXCEPT ![((CASE [x \in 1..2 |-> x] -> -1 [] OTHER -> 7 % Cardinality([x \in Nat |-> x + 1])) % ((-3) \div CASE TRUE -> 3 [] OTHER -> 2))] = LET b6960 == ((0 * 7) \div IF TRUE THEN -1 ELSE 0) IN CASE (b6960 < 0) -> CASE [x \in 1..2 |-> x] -> -1 [] OTHER -> 0 [] OTHER -> (<<3, 1, 2>> + 3)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04424 failed.
    A non-boolean expression (a function  of the form (d1 :> e1 @@ ... @@ dN :> eN)) was used as a condition of a CASE. line 14, col 80 to line 14, col 97 of module random_04424
---*)
