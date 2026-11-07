(*---
description: Evaluates a random record expression, seed 262, number 7522.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07522 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b11589 == IF (TRUE /\ TRUE) THEN Cardinality(Nat) ELSE CASE TRUE -> 2147483647 [] OTHER -> 2 IN (({x \in 1..3 : x > 1} \ {}) \ {b11590 \in b11589 : TRUE}), b |-> ((([a |-> 1, b |-> TRUE] \subseteq {1}) <=> (\E b11591 \in {x \in 1..3 : x > 1} : [a |-> 1])) <=> (IF TRUE THEN 2147483647 ELSE 7 = (2147483647 * 2147483647)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
