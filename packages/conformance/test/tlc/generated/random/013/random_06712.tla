(*---
description: Evaluates a random bool expression, seed 262, number 6712.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06712 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Append(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), (1 % -1))) = (CASE (\E b10288 \in 1..3 : FALSE) -> (0 * 2147483647) [] OTHER -> SelectSeq(<<1>>, LAMBDA e : e > 0) * CASE (<<>> = <<5, 6>>) -> (TRUE - 2147483647) [] OTHER -> CASE TRUE -> 1 [] OTHER -> 3)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06712 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
