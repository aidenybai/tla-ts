(*---
description: Evaluates a random int expression, seed 262, number 3324.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03324 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len((SubSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), CASE FALSE -> 7 [] OTHER -> 2147483647, IF <<1>> THEN 2 ELSE 0) \o SubSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), Len(<<3, 1, 2>>), [<<>> EXCEPT ![1] = 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03324 failed.
    A non-boolean expression (a tuple) was used as the condition of an IF.
    line 14, col 105 to line 14, col 126 of module random_03324
---*)
