(*---
description: Evaluates a random seq expression, seed 262, number 9149.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09149 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a, Head(Append(SubSeq(<<1, 2>>, 3, 0), Cardinality(1..3)))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 3>>"
---*)
