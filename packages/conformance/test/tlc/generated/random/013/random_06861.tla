(*---
description: Evaluates a random function expression, seed 262, number 6861.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06861 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE) @@ ((CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE) @@ (IF FALSE THEN 2 ELSE 2 :> Head(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> 2 @@ 1 :> 2 @@ 2 :> 2 @@ 3 :> 2)"
---*)
