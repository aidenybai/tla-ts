(*---
description: Evaluates a random bool expression, seed 262, number 8880.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08880 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({IF FALSE THEN 1 ELSE b13751 : b13751 \in {b13752 : b13752 \in {x \in 1..3 : x > 1}}} \cup (({x \in 1..3 : x > 1} \ {}) \ (2..1 \cup {1}))), ((CHOOSE b13753 \in {7, 2147483647} : (b13753 = b13753)) .. LET b13754 == ([a |-> 1]).a IN ([a |-> 1, b |-> TRUE]).a)})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 3}"
---*)
