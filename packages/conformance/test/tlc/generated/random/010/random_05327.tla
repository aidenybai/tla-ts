(*---
description: Evaluates a random int expression, seed 262, number 5327.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05327 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(([SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = CASE FALSE -> -1 [] OTHER -> 3] = Len(Tail(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05327 failed.
    Attempted to check equality of the function <<3, 1, 2>> with the value:
    2
---*)
