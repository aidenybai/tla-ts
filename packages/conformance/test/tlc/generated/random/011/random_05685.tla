(*---
description: Evaluates a random bool expression, seed 262, number 5685.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05685 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b8758 \in {b8759 \in {1, 1} : (2..1 = {1, 2})} : ((-b8758) < {b8760 \in {} : TRUE})} \subseteq (UNION {{3 : b8761 \in {}}, UNION {{2, 1, 3}, {2, 1, 3}}} \ {(0 * b8762) : b8762 \in {b8763 \in {} : FALSE}})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
