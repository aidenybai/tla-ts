(*---
description: Evaluates a random set expression, seed 262, number 9103.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09103 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len([Append(<<1>>, -1) EXCEPT ![1] = LET b14140 == 2147483647 IN 0]) .. Head([[<<1>> EXCEPT ![1] = 1] EXCEPT ![1] = (CHOOSE b14141 \in SUBSET {1} : FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09103 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 134 to line 14, col 169 of module random_09103
---*)
