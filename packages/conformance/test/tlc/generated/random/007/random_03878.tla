(*---
description: Evaluates a random bool expression, seed 262, number 3878.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03878 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\E b6106 \in <<(-1 * 1), LET b6107 == 0 IN b6107>> : (\E b6108 \in UNION {Nat, 2..1} : (~TRUE))) <=> ((~(~[a |-> 1, b |-> TRUE])) => ((\A b6109 \in Nat : FALSE) \in {b6110 \in SUBSET {1} : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03878 failed.
    TLC encountered a non-enumerable quantifier bound
    <<-1, 0>>.
    line 14, col 31 to line 14, col 67 of module random_03878
---*)
