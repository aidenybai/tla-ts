(*---
description: Evaluates a random bool expression, seed 262, number 3008.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03008 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SelectSeq((<<>> \o <<>>), LAMBDA e : e > 0)) < (LET b4782 == CASE TRUE -> 2147483647 [] OTHER -> 2 IN Cardinality(1..3) + ((0 :> 3))[(1 + 3)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
