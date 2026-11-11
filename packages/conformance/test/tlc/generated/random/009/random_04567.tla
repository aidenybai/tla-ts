(*---
description: Evaluates a random seq expression, seed 262, number 4567.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04567 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<IF ({1} = {1}) THEN LET b7163 == 2147483647 IN 1 ELSE (1 \div 0), (CASE TRUE -> 0 [] OTHER -> 3 - (-1))>> \o SubSeq(SelectSeq(<<-1, 0>>, LAMBDA e : e > 0), ([a |-> 3, b |-> TRUE]).a, Append(Tail(<<3, 1, 2>>), (0 - -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04567 failed.
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    <<1, 2, 1>>
---*)
