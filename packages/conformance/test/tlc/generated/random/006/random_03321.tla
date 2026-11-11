(*---
description: Evaluates a random int expression, seed 262, number 3321.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03321 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b5281 \in (DOMAIN (0 :> 2) \cup (([x \in Nat |-> x + 1] :> 2) \cap UNION {{2, 1, 3}, SUBSET {1}})) : ((CHOOSE f \in [{1, 2} \ {1} -> {1, 2} \ {1}] : TRUE) \in ({3 : b5282 \in TRUE} \cap ({} \cap <<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03321 failed.
    Attempted to check if the value:
    {}
    is an element of the function ([x \in Nat |-> <expression line 14, col 73 to line 14, col 77 of module random_03321>] :> 2)
---*)
