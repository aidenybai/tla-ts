(*---
description: Evaluates a random function expression, seed 262, number 4276.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04276 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(LET b6731 == 1 IN b6731 :> (CHOOSE b6732 \in Nat : <<3, 1, 2>>)) EXCEPT ![CASE (TRUE <=> FALSE) -> Len([x \in Nat |-> x + 1]) [] OTHER -> (1 % -1)] = ((7 + 2147483647) % Cardinality({}))] EXCEPT ![((CHOOSE r \in [a : {1}] : TRUE)).a] = Cardinality({b6733 \in (FALSE \cup 1..3) : (FALSE /\ FALSE)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04276 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 47 to line 14, col 80 of module random_04276
---*)
