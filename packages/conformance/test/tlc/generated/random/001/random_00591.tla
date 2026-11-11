(*---
description: Evaluates a random bool expression, seed 262, number 591.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00591 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((<<(-1), (CHOOSE b990 \in {1} : FALSE)>> \o SortSeq(<<3, 2>>, LAMBDA p, q : p < q)) = [b991 \in {((1 :> 2))[7] : b992 \in {2147483647, 2147483647}} |-> Cardinality(UNION {SUBSET {1}, {x \in 1..3 : x > 1}})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00591 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 27 to line 14, col 53 of module random_00591
---*)
