(*---
description: Evaluates a random int expression, seed 262, number 9506.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09506 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b14762 == ([[a |-> 2, b |-> TRUE] EXCEPT !.a = (3 % -1)]).a IN (LET b14763 == ([a |-> 1] * b14762) IN Cardinality(Nat) - Cardinality(DOMAIN [x \in Nat |-> x + 1])))
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
