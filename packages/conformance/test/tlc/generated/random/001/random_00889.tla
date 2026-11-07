(*---
description: Evaluates a random function expression, seed 262, number 889.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00889 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({2, 1, 3}) - (2147483647 % 0)) :> ((CHOOSE r \in [a : {}] : TRUE)).a) @@ [(CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE) EXCEPT ![((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a] = CASE (TRUE \/ FALSE) -> {7, 0} [] OTHER -> CASE TRUE -> [x \in 1..2 |-> x] [] OTHER -> 0]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
