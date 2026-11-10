(*---
description: Evaluates a random function expression, seed 262, number 5762.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05762 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b8873 \in (((<<5, 6>> \cup {x \in 1..3 : x > 1}) \cap {2147483647 : b8874 \in <<>>}) \cap UNION {UNION {Nat, 1..3}, {7, 2}}) |-> (-Head(<<FALSE, b8873>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05762 failed.
    TLC encountered a non-enumerable quantifier bound
    <<>>.
    line 14, col 95 to line 14, col 98 of module random_05762
---*)
