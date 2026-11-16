(*---
description: Evaluates a random seq expression, seed 262, number 9083.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09083 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE ((2..1 = {2, 1, 3}) \/ (TRUE /\ TRUE)) -> LET b14119 == IF TRUE THEN 3 ELSE 3 IN Len(<<>>) [] OTHER -> ([b14120 \in Nat |-> 2147483647])[IF TRUE THEN 1 ELSE -1], Len(Append(<<0, 2147483647>>, (-1)))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 3>>"
---*)
