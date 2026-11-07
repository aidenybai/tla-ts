(*---
description: Evaluates a random bool expression, seed 262, number 2217.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02217 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(Tail(<<3, 2>>), LAMBDA e : e > 0) = [((-1 + 0) :> ([a |-> 1, b |-> TRUE]).a) EXCEPT ![([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7]).a] = LET b3492 == Cardinality(1..3) IN CASE TRUE -> b3492 [] OTHER -> 7]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 65 to line 14, col 101 of module random_02217
    | FALSE
---*)
