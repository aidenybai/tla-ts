(*---
description: Evaluates a random int expression, seed 262, number 2650.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02650 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (((FALSE <=> FALSE) /\ (\A b4182 \in 1..3 : TRUE)) => (Tail(<<3, 1, 2>>) = [b4183 \in 2..1 |-> [x \in 1..2 |-> x]])) -> (((2 - 0) :> (-1 - -1)))[((1 - 3) + IF TRUE THEN 7 ELSE 7)] [] OTHER -> Cardinality(UNION {({1, 2} \ {1, 2}), UNION {1..3, {}}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
