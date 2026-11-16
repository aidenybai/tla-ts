(*---
description: Evaluates a random int expression, seed 262, number 4530.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04530 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail((<<3, 2147483647>> \o DOMAIN (1 :> 2)))).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04530 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    {1}
---*)
