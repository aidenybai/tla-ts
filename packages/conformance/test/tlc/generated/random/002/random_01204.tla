(*---
description: Evaluates a random int expression, seed 262, number 1204.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01204 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b1937 \in {b1938 \in (UNION {{1, 2}, 2..1} \ (Nat \cup SUBSET {1})) : [SubSeq(<<3, 1, 2>>, b1938, b1938) EXCEPT ![1] = (7 % {})]} : ({(1 \div 1), (b1937 % 2147483647)} \subseteq DOMAIN [(1 :> 2) EXCEPT ![b1937] = b1937])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01204 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 17 to line 14, col 243 of module random_01204
---*)
