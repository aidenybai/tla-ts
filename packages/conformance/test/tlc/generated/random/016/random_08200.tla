(*---
description: Evaluates a random bool expression, seed 262, number 8200.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08200 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((~TRUE) <=> (~FALSE)) \/ ({b12688 \in 1..3 : FALSE} \subseteq (3 < 0))) \/ ((Len(<<>>) = (-1)) \/ ([[a |-> 1] EXCEPT !.a = @ + 1] = (2..1 \subseteq {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
