(*---
description: Evaluates a random int expression, seed 262, number 5146.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05146 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (Append(<<3, 1, 2>>, 2) = (2 + 2147483647)) -> [SubSeq(<<>>, -1, -1) EXCEPT ![1] = [<<5, 6>> EXCEPT ![1] = 2]] [] OTHER -> Head([TRUE EXCEPT ![1] = 0]) * Head(SelectSeq(Tail(<<1, 2>>), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05146 failed.
    2178:0 Overflow when computing 2+2147483647
---*)
