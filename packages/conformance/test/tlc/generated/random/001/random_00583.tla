(*---
description: Evaluates a random seq expression, seed 262, number 583.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00583 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(<<(7 - 7), (CHOOSE b981 \in {1} : FALSE)>>, ((2147483647 % 2147483647) - ((1 :> 2))[2])) \o <<(([a |-> 1, b |-> TRUE]).a .. (<<5, 6>>)[0]), LET b982 == (7 - 2) IN ([a |-> 1]).a>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00583 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 36 to line 14, col 62 of module random_00583
---*)
