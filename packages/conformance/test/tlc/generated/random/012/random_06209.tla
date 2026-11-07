(*---
description: Evaluates a random seq expression, seed 262, number 6209.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06209 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(Head(SubSeq(<<3, 1, 2>>, -1, -1)) + ([[a |-> 1] EXCEPT !.a = 2147483647]).a), (LET b9562 == (1 = 2147483647) IN (2147483647 % 2147483647) \div (Len(<<>>) + CASE TRUE -> 2147483647 [] OTHER -> 1))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    -1
---*)
