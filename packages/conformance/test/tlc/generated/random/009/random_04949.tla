(*---
description: Evaluates a random int expression, seed 262, number 4949.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04949 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({IF (\A b7695 \in {x \in 1..3 : x > 1} : [x \in 1..2 |-> x]) THEN (b7694 \div 1) ELSE CASE 7 -> 0 [] OTHER -> b7694 : b7694 \in {b7696 \in (SUBSET {1} \cap 2..1) : (\E b7697 \in 1..3 : TRUE)}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
