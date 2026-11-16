(*---
description: Evaluates a random int expression, seed 262, number 9927.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09927 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((TRUE <=> TRUE) \/ (<<>> = (1 :> 2))) THEN ((2 - 3) < ([a |-> 1]).a) ELSE ((2 + 2147483647) % LET b15442 == 0 IN b15442) \div CASE ([[a |-> 1] EXCEPT !.a = 0] \subseteq ({} \cap SUBSET {1})) -> (-(CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \ {1}] : TRUE)) [] OTHER -> (([a |-> 1]).a % Head(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
