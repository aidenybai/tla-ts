(*---
description: Evaluates a random seq expression, seed 262, number 6665.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06665 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Append(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), CASE FALSE -> 7 [] OTHER -> 7) \o SortSeq([<<>> EXCEPT ![1] = 1], LAMBDA p, q : p < q)) \o Tail(Append(Append(<<>>, 2147483647), (7 \div 2)))))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 107 to line 14, col 110 of module random_06665
    | <<1, 2, 7, 3>>
---*)
