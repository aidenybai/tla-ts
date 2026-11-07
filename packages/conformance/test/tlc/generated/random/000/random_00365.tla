(*---
description: Evaluates a random function expression, seed 262, number 365.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00365 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b601 \in {IF ([a |-> 1] = [a |-> 1]) THEN CASE TRUE -> b602 [] OTHER -> b602 ELSE ([a |-> 1]).a : b602 \in {Len(<<>>) : b603 \in {b604 \in {x \in 1..3 : x > 1} : TRUE}}} |-> (Cardinality({b601, b601}) + (Head(<<>>) + (CHOOSE b605 \in SUBSET {1} : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
