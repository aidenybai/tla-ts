(*---
description: Evaluates a random int expression, seed 262, number 564.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00564 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(<<(-(2147483647 + 3)), {b953 \in {TRUE : b954 \in {1}} : (TRUE < b953)}>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00564 failed.
    2178:0 Overflow when computing 2147483647+3
---*)
