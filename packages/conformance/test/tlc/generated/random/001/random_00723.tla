(*---
description: Evaluates a random seq expression, seed 262, number 723.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00723 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<((<<1, 2>> \o <<3, 1, 2>>) + (2147483647 + 2)), (CHOOSE b1190 \in {0, 2147483647} : (FALSE <=> TRUE))>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+2
    2178:0 Overflow when computing 2147483647+2
---*)
