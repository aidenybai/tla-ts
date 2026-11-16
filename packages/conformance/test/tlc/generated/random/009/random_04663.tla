(*---
description: Evaluates a random set expression, seed 262, number 4663.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04663 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b7286 \in ({x \in 1..3 : x > 1} \cup 2..1) : (b7286 \in Nat)), b |-> (({1} = {x \in 1..3 : x > 1}) => ({1} = {1, 2}))] EXCEPT !.a = @ + Len(SortSeq(Append(<<1, 2>>, 3), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 5, b |-> TRUE]"
---*)
