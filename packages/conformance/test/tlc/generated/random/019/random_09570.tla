(*---
description: Evaluates a random bool expression, seed 262, number 9570.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09570 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<Len((<<3, 1, 2>> \o <<1, 2>>)), (-(2 * 2147483647))>> \o Append(((1 .. 2147483647) \cup {3, 1}), (CHOOSE r \in [a : {2, 1, 3}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09570 failed.
    2178:0 Overflow when computing 2*2147483647
---*)
