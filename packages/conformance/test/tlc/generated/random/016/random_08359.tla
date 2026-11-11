(*---
description: Evaluates a random bool expression, seed 262, number 8359.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08359 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b12932 == IF (\A b12933 \in {1} : [a |-> 1]) THEN (2 * 3) ELSE Cardinality(SUBSET {1}) IN (Cardinality({}) - (b12932 % b12932)) = (Len((-7)) + SelectSeq(Append(<<3, 1, 2>>, 2147483647), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08359 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 35 to line 14, col 63 of module random_08359
---*)
