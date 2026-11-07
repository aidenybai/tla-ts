(*---
description: Evaluates a random set expression, seed 262, number 8901.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08901 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{0} \cup {1} -> {1, 2} \cap {2}] : TRUE) @@ (~({1} = 2..1))) @@ (LET b13786 == (CHOOSE b13787 \in {1, 2} : TRUE) IN LET b13788 == b13786 IN b13788 :> ((1 - -1) % (3 - 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of @@ should be a function, but instead it is:
    TRUE
    2169:0 The second argument of @@ should be a function, but instead it is:
    TRUE
---*)
