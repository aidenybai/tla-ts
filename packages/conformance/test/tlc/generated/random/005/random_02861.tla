(*---
description: Evaluates a random seq expression, seed 262, number 2861.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02861 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Cardinality({(2147483647 * 1), Head(<<1, 2>>)}), LET b4533 == ([[x \in Nat |-> x + 1] EXCEPT ![0] = 2147483647])[(2 * 0)] IN CASE (\E b4534 \in {1} : TRUE) -> Head(<<1, 2>>) [] OTHER -> (CHOOSE f \in [{1, 2} \cap {2} -> {1}] : TRUE)>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 1>>"
---*)
