(*---
description: Evaluates a random record expression, seed 262, number 3777.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03777 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((DOMAIN (1 :> 2) \cup {2, 2147483647}) \ (Cardinality({x \in 1..3 : x > 1}) .. IF FALSE THEN 2147483647 ELSE 1)), [[[[a |-> 1] EXCEPT !.a = 2] EXCEPT !.a = Cardinality(TRUE)] EXCEPT !.a = @ + Len(<<1, 0>>)]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    TRUE
    2181:0 Attempted to compute cardinality of the value
    TRUE
---*)
