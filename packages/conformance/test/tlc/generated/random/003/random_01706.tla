(*---
description: Evaluates a random record expression, seed 262, number 1706.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01706 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Len((<<3, 1, 2>> \o <<1, 2>>)), b |-> (~(~TRUE))] EXCEPT !.a = (Head(Append(<<>>, 2)) % LET b2725 == ([a |-> 1]).a IN (b2725 \div 2))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01706 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
