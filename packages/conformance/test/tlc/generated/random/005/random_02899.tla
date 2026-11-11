(*---
description: Evaluates a random int expression, seed 262, number 2899.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02899 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b4589 == LET b4590 == Cardinality(UNION {SUBSET {1}, {1, 2}}) IN (([x \in 1..2 |-> x])[b4590] + (<<5, 6>> * b4590)) IN ((SortSeq(<<>>, LAMBDA p, q : p < q)).a % (CHOOSE b4591 \in {b4592 \in (1 :> 2) : FALSE} : (FALSE <=> TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02899 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
