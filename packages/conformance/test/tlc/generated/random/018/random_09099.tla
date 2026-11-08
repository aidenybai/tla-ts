(*---
description: Evaluates a random int expression, seed 262, number 9099.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09099 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-LET b14135 == CASE FALSE -> 2147483647 [] OTHER -> 0 IN (b14135 \div 1)) - Head((SelectSeq(<<1>>, LAMBDA e : e > 0) \o (<<1, 2>> \o TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09099 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    TRUE
---*)
