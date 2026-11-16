(*---
description: Evaluates a random bool expression, seed 262, number 9806.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09806 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (FALSE \/ FALSE) -> (SUBSET {1} \cup {1}) [] OTHER -> IF TRUE THEN 2147483647 ELSE 2147483647 + Len(Append(<<1>>, 7))) < LET b15216 == Cardinality((3 .. 2)) IN (IF FALSE THEN b15216 ELSE 3 + (-1 - 2))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
