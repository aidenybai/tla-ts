(*---
description: Evaluates a random seq expression, seed 262, number 6729.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06729 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Append([Append(<<1>>, 1) EXCEPT ![1] = (2 \div 3)], Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))), LET b10315 == (([a |-> 1, b |-> TRUE]).a % (SUBSET {1} = {x \in 1..3 : x > 1})) IN [[<<1, 2>> EXCEPT ![1] = 0] EXCEPT ![1] = CASE FALSE -> 0 [] OTHER -> b10315]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06729 failed.
    Attempted to check equality of the set {} with the value:
    2
---*)
