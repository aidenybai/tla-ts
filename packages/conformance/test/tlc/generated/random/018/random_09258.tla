(*---
description: Evaluates a random seq expression, seed 262, number 9258.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09258 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq((SelectSeq(<<>>, LAMBDA e : e > 0) \o SortSeq(<<1, 2>>, LAMBDA p, q : p < q)), IF (2147483647 \in SUBSET {1}) THEN IF TRUE THEN -1 ELSE 7 ELSE (2147483647 - 0), (IF <<3, 1, 2>> THEN -1 ELSE 0 \div (2147483647 * 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09258 failed.
    Attempted to check if the non-enumerable value
    2147483647
    is element of
    {{}, {1}}
---*)
