(*---
description: Evaluates a random int expression, seed 262, number 8720.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08720 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<((3 - 2147483647) \div Cardinality([x \in 1..2 |-> x])), IF (2 = 2147483647) THEN Cardinality(2..1) ELSE ((1 :> 2))[7]>> \div CASE ((<<3, 1, 2>> = [x \in Nat |-> x + 1]) /\ (FALSE /\ FALSE)) -> IF (SUBSET {1} = 1) THEN (CHOOSE b13505 \in SUBSET {1} : TRUE) ELSE IF TRUE THEN 3 ELSE 7 [] OTHER -> (Cardinality({x \in 1..3 : x > 1}) % (1 - 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<1, 2>>
    2181:0 Attempted to compute cardinality of the value
    <<1, 2>>
---*)
