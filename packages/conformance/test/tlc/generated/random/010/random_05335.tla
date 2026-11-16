(*---
description: Evaluates a random int expression, seed 262, number 5335.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05335 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b8249 == ([a |-> 0, b |-> TRUE]).a IN Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) % (((<<>> \o <<1, 2>>))[Head(<<>>)] + (LET b8250 == 3 IN 2 * (-1 + 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05335 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
