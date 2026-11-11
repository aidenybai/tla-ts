(*---
description: Evaluates a random function expression, seed 262, number 1014.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01014 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((1 * 2) :> CASE TRUE -> {2, 1, 3} [] OTHER -> 0) @@ (CHOOSE f \in [{1, 2} -> {1}] : TRUE)) EXCEPT ![(((-3) - (CHOOSE b1630 \in {x \in 1..3 : x > 1} : TRUE)) % CASE (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) -> (0 + 1) [] OTHER -> Cardinality(Nat))] = ((((1 :> 2))[[a |-> 1]] \div (CHOOSE b1631 \in SUBSET {1} : FALSE)) + (Cardinality({1}) \div (7 + 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01014 failed.
    A non-boolean expression (a record) was used as a condition of a CASE. line 14, col 184 to line 14, col 224 of module random_01014
---*)
