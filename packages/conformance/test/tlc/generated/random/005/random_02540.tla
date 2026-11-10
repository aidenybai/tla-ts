(*---
description: Evaluates a random bool expression, seed 262, number 2540.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02540 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b4004 \in (UNION {{1}, {2, 1, 3}} \ ({2, 1, 3} \cup {x \in 1..3 : x > 1})) : LET b4005 == (7 \div b4004) IN Head(<<3, 1, 2>>)} = {(IF TRUE THEN b4006 ELSE TRUE % (CHOOSE b4007 \in {1, 2} : FALSE)) : b4006 \in ((Nat \cap {x \in 1..3 : x > 1}) \ (Nat \cup <<1, 2>>))}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
