(*---
description: Evaluates a random int expression, seed 262, number 6727.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06727 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(DOMAIN [(1 :> 2) EXCEPT ![0] = 2]) % LET b10312 == IF (TRUE <=> FALSE) THEN CASE TRUE -> -1 [] OTHER -> 7 ELSE (<<1>> \o <<>>) IN Len(SubSeq(<<1>>, b10312, 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 38 to line 14, col 43 of module random_06727
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06727 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    <<1>>
---*)
