(*---
description: Evaluates a random int expression, seed 262, number 4756.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04756 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 - 7) % IF TRUE THEN 1 ELSE [a |-> 1]) - (-Cardinality({x \in 1..3 : x > 1}))) - IF ((2..1 \ SUBSET {1}) \subseteq DOMAIN [x \in Nat |-> x + 1]) THEN IF (<<1>> = [x \in 1..2 |-> x]) THEN Len(<<1>>) ELSE (-1 * 2147483647) ELSE (CHOOSE b7427 \in UNION {{1, 2}, {}} : (7 \in {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04756 failed.
    2178:0 Overflow when computing 2--2147483647
---*)
