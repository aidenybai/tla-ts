(*---
description: Evaluates a random record expression, seed 262, number 4833.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04833 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[SortSeq(<<1, 2>>, LAMBDA p, q : p < q) EXCEPT !.a = (-3)] EXCEPT !.a = @ + [[[a |-> 1, b |-> TRUE] EXCEPT !.a = TRUE] EXCEPT !.a = @ + ([a |-> 1, b |-> TRUE]).a]] EXCEPT !.a = Head(Append([<<1, 2>> EXCEPT ![1] = 2147483647], (1 + 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04833 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
