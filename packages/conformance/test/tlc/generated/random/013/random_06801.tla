(*---
description: Evaluates a random bool expression, seed 262, number 6801.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06801 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(SubSeq(<<>>, 3, 2)) = (-(2147483647 - 0))) => (~(SubSeq(<<1>>, 7, -1) = [b10434 \in SUBSET {1} |-> [a |-> 1]]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
