(*---
description: Evaluates a random function expression, seed 262, number 8446.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08446 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(LET b13074 == (2147483647 * 2147483647) IN (<<5, 6>>)[b13074] :> IF (<<3, 1, 2>> = <<1>>) THEN ((1 :> 2))[-1] ELSE Head(3)) EXCEPT ![Len(((-7) < (0 * 0)))] = Cardinality({IF TRUE THEN <<5, 6>> ELSE b13075 : b13075 \in {b13076 : b13076 \in {1, 2}}})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08446 failed.
    2178:0 Overflow when computing 2147483647*2147483647
---*)
