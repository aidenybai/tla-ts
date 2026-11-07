(*---
description: Evaluates a random set expression, seed 262, number 6527.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06527 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN (CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE), {IF (<<5, 6>> \cap b10027) THEN (7 * b10027) ELSE ([x \in Nat |-> x + 1])[3] : b10027 \in [[[a |-> 1] EXCEPT !.a = -1] EXCEPT !.a = Cardinality(Nat)]}})
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
