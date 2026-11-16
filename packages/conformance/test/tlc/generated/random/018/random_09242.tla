(*---
description: Evaluates a random seq expression, seed 262, number 9242.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09242 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SortSeq(<<(2147483647 + 1), [[a |-> 1] EXCEPT !.a = @ + 7]>>, LAMBDA p, q : p < q) EXCEPT ![1] = LET b14348 == (([a |-> 1]).a % CASE 0 -> 7 [] OTHER -> <<5, 6>>) IN ([a |-> b14348, b |-> TRUE]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09242 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
