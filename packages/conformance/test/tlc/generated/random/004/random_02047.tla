(*---
description: Evaluates a random bool expression, seed 262, number 2047.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02047 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([SortSeq(<<1>>, LAMBDA p, q : p < q) EXCEPT ![1] = (3 + 7)] = (CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE)) => (((7 \div 7) \in ({2, 1, 3} \ 2..1)) /\ (~(~TRUE)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
