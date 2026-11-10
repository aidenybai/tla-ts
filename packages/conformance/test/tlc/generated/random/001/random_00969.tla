(*---
description: Evaluates a random bool expression, seed 262, number 969.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00969 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((Len(<<1>>) % Len(<<3, 1, 2>>)) :> (IF TRUE THEN 2 ELSE 2 % Len(<<1>>))) EXCEPT ![Head(SortSeq(<<2147483647, 7>>, LAMBDA p, q : p < q))] = ((CHOOSE r \in [a : {1}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 88 of module random_00969
    | <<2>>
---*)
