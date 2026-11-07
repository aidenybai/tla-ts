(*---
description: Evaluates a random record expression, seed 262, number 1940.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01940 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((CHOOSE b3051 \in {2, 1, 3} : FALSE) < (1 % 2)) -> (((1 :> 2))[-1] + (<<5, 6>>)[3]) [] OTHER -> (CHOOSE b3052 \in {b3053 \in Nat : TRUE} : (7 % b3052)) \/ ([SelectSeq(<<1>>, LAMBDA e : e > 0) EXCEPT ![1] = ([a |-> 1]).a] = [[b3054 \in {} |-> 2] EXCEPT ![LET b3055 == -1 IN 7] = [a |-> 0, b |-> TRUE]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01940 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 24 to line 14, col 57 of module random_01940
---*)
