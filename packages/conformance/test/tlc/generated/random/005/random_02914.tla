(*---
description: Evaluates a random int expression, seed 262, number 2914.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02914 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Append((<<1, 2>> \o <<>>), IF TRUE THEN 2147483647 ELSE 2147483647)) % ([a |-> (-1 - 7), b |-> ([a |-> 1] <=> FALSE)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02914 failed.
    Attempted to evaluate an expression of form P <=> Q when P or Q was not a boolean.
    line 14, col 117 to line 14, col 135 of module random_02914
---*)
