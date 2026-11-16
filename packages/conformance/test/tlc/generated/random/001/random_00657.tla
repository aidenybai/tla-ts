(*---
description: Evaluates a random bool expression, seed 262, number 657.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00657 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({7, 0} = {b1099 \in {1} : FALSE}) => ((TRUE <=> FALSE) \/ SortSeq(<<1>>, LAMBDA p, q : p < q))) /\ (((3 < 7) <=> (FALSE \/ TRUE)) \/ (Append(<<>>, 1) = ([a |-> 1] :> 2)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
