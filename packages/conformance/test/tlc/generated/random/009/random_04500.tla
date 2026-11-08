(*---
description: Evaluates a random set expression, seed 262, number 4500.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04500 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {DOMAIN SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0), ({(2147483647 % 0), (7 % 7)} \cap UNION {({2, 1, 3} \cup {2, 1, 3}), ({x \in 1..3 : x > 1} \ 2..1)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04500 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
