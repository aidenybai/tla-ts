(*---
description: Evaluates a random bool expression, seed 262, number 9388.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09388 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\A b14566 \in ({} \ {1, 2}) : (TRUE <=> FALSE)) \/ ((~TRUE) => (TRUE <=> FALSE))) /\ (Cardinality({b14567 \in {1} : FALSE}) < CASE (FALSE <=> FALSE) -> (1 \div 1) [] OTHER -> IF TRUE THEN 3 ELSE 2147483647)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
