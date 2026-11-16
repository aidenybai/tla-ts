(*---
description: Evaluates a random set expression, seed 262, number 7737.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07737 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((1 :> [a |-> 1]) @@ (CHOOSE f \in [{1, 2} \cap {2} -> 1..2] : TRUE)) EXCEPT ![((CHOOSE b11937 \in {} : FALSE) - (<<5, 6>>)[0])] = IF (FALSE \/ FALSE) THEN Cardinality(1..3) ELSE IF TRUE THEN 7 ELSE -1] \cap DOMAIN (LET b11938 == 2 IN -1 :> (CHOOSE r \in [a : {2, 1, 3}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07737 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 99 to line 14, col 126 of module random_07737
---*)
