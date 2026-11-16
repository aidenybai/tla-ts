(*---
description: Evaluates a random set expression, seed 262, number 4153.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04153 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b6535 == LET b6536 == (3 + 1) IN Cardinality(2..1) IN Len((<<3, 1, 2>> \o <<3, 1, 2>>)) .. (Cardinality({b6537 \in {1, 2} : TRUE}) - IF (\E b6538 \in {x \in 1..3 : x > 1} : TRUE) THEN (<<>>).a ELSE (CHOOSE b6539 \in {} : FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04153 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
