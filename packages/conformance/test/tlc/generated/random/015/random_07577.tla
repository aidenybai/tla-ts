(*---
description: Evaluates a random bool expression, seed 262, number 7577.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07577 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SubSeq(Append(<<1>>, 2147483647), LET b11661 == 3 IN b11661, (3 * 3))) = ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = (-1 \div 3)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2147483647>>
    , but instead it is
    3
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 2147483647>>
    , but instead it is
    3
---*)
