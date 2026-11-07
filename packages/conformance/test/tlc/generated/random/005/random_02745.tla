(*---
description: Evaluates a random set expression, seed 262, number 2745.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02745 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (Len(<<>>) :> (2 \div 2)) \cap (UNION {({x \in 1..3 : x > 1} \ {}), ({2, 1, 3} \cup {1})} \cap {IF TRUE THEN 1 ELSE 7, Head(<<1, 2>>)})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
