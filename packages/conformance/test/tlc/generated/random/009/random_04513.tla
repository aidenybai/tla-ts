(*---
description: Evaluates a random seq expression, seed 262, number 4513.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04513 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<CASE (-1 % 2147483647) -> LET b7089 == 2 IN 7 [] OTHER -> Head(<<1, 2>>), Len(SelectSeq(<<>>, LAMBDA e : e > 0))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04513 failed.
    A non-boolean expression (an integer) was used as a condition of a CASE. line 14, col 29 to line 14, col 43 of module random_04513
---*)
