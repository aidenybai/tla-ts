(*---
description: Evaluates a random function expression, seed 262, number 9573.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09573 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE) @@ [b14863 \in DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE) |-> (Head(<<1>>) \div (b14863 - 3))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (0 :> 2 @@ 1 :> 2 @@ 2 :> -1)"
---*)
