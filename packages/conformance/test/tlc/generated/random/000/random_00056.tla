(*---
description: Evaluates a random function expression, seed 262, number 56.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00056 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \ {1}] : TRUE) EXCEPT ![Len([<<7, 0>> EXCEPT ![1] = Len(<<1>>)])] = ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] EXCEPT !.a = @ + Cardinality({2, 1, 3})]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| (2 :> 6)"
---*)
