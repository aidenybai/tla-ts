(*---
description: Evaluates a random seq expression, seed 262, number 1650.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01650 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<Tail(<<3, 3>>), (IF FALSE THEN 1 ELSE 3 * (-3))>>, (Len(Append(<<3, 1, 2>>, 2)) % (Tail(<<1, 2>>) - (2 + 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01650 failed.
    2178:0 Overflow when computing 2+2147483647
---*)
