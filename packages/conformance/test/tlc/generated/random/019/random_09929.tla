(*---
description: Evaluates a random function expression, seed 262, number 9929.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09929 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{} -> {2, 1, 3}] : TRUE) EXCEPT ![Cardinality(DOMAIN [b15446 \in Nat |-> b15446])] = ([(2147483647 :> 2) EXCEPT ![LET b15447 == 2147483647 IN 2] = IF FALSE THEN 7 ELSE -1])[Cardinality((SUBSET {1} \ SUBSET {1}))]])
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
