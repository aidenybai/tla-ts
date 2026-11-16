(*---
description: Evaluates a random record expression, seed 262, number 1302.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01302 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] EXCEPT !.a = @ + ([a |-> 1]).a] EXCEPT !.a = @ + ((CHOOSE r \in [a : 1..2] : TRUE)).a] EXCEPT !.a = @ + Cardinality(((1 * 2) .. (7 \div 3)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 5, b |-> TRUE]"
---*)
