(*---
description: Evaluates a random bool expression, seed 262, number 9849.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09849 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(b15290 \div b15290) : b15290 \in {b15291 \in {} : FALSE}} \subseteq {(-b15292) : b15292 \in {b15293 \in {2, 1, 3} : FALSE}}) => (Head([<<1, 2>> EXCEPT ![1] = -1]) = Cardinality(({1, 2} \ {})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
