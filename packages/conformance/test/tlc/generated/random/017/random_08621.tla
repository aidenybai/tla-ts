(*---
description: Evaluates a random seq expression, seed 262, number 8621.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08621 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail(Tail((<<>> \o FALSE))) \o SelectSeq(Append(<<7, 1>>, ([a |-> 1]).a), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08621 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    FALSE
---*)
