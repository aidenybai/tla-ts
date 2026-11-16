(*---
description: Evaluates a random seq expression, seed 262, number 8731.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08731 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<[[SelectSeq(<<1, 2>>, LAMBDA e : e > 0) EXCEPT !.a = @ + (1..3 + 2)] EXCEPT !.a = @ + Cardinality(UNION {2..1, 2..1})], ([[a |-> 1, b |-> FALSE] EXCEPT !.a = @ + ([a |-> 1, b |-> TRUE]).a]).a>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08731 failed.
    Attempted to access tuple at a non integral index: "a"
---*)
