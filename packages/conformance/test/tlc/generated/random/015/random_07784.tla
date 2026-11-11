(*---
description: Evaluates a random bool expression, seed 262, number 7784.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07784 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b12010 \in ((DOMAIN [x \in Nat |-> x + 1] \cap (3 .. 2147483647)) \ ((CHOOSE b12011 \in SUBSET {1} : TRUE) .. (<<5, 6>>)[7])) : (\E b12012 \in (Head(<<1>>) .. (<<5, 6>>)[b12010]) : (({x \in 1..3 : x > 1} \cup 1..3) = DOMAIN [x \in 1..2 |-> x]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07784 failed.
    Attempted to construct a set with too many elements (>1000000).
---*)
