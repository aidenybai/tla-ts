(*---
description: Evaluates a random function expression, seed 262, number 8075.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08075 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((IF FALSE THEN -1 ELSE 1 * Cardinality([a |-> 1])) - Len([<<1>> EXCEPT ![1] = 3])) :> ((CHOOSE b12481 \in ({1} \ {x \in 1..3 : x > 1}) : (b12481 = b12481)) \div LET b12482 == IF (1 :> 2) THEN 0 ELSE 3 IN (7 % [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1]
    2181:0 Attempted to compute cardinality of the value
    [a |-> 1]
---*)
