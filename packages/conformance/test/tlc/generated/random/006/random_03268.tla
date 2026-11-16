(*---
description: Evaluates a random bool expression, seed 262, number 3268.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03268 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE f \in [{1} -> {1}] : TRUE))[((-1 :> 2147483647))[(CHOOSE b5201 \in 1..3 : FALSE)]] \in (IF (2..1 \subseteq SUBSET {1}) THEN ([x \in Nat |-> x + 1])[2147483647] ELSE Cardinality(2..1) .. Head((<<1>> \o <<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03268 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 76 to line 14, col 104 of module random_03268
---*)
