(*---
description: Evaluates a random function expression, seed 262, number 836.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00836 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1361 \in {(Cardinality(Nat) - (-1 % 7)), (Cardinality({}) * Cardinality({1}))} |-> LET b1362 == (IF FALSE THEN b1361 ELSE <<1>> \div (-3)) IN (CHOOSE b1363 \in {b1364 \in {1} : FALSE} : (TRUE <=> TRUE))])
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
