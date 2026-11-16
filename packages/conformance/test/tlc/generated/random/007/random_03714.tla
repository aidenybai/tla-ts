(*---
description: Evaluates a random bool expression, seed 262, number 3714.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03714 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> LET b5870 == (7 * 2147483647) IN Len(<<1, 2>>), b |-> ((2 = 1) <=> (3 \in SUBSET {1}))] = [a |-> (Len(<<3, 1, 2>>) % IF FALSE THEN <<>> ELSE 3), b |-> ((FALSE => <<3, 1, 2>>) => (\A b5871 \in {x \in 1..3 : x > 1} : FALSE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03714 failed.
    Attempted to check if the non-enumerable value
    3
    is element of
    {{}, {1}}
---*)
