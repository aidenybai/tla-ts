(*---
description: Evaluates a random int expression, seed 262, number 433.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00433 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b707 \in (((-1 .. 3) \ ({2, 1, 3} \cup {1, 2})) \ ((Nat \cup {1, 2}) \ ({1, 2} \cap {}))) : (((\E b708 \in {} : FALSE) <=> (b707 = 7)) \/ (Tail(<<>>) = {b707 : b709 \in Nat}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
