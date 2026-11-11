(*---
description: Evaluates a random int expression, seed 262, number 9362.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09362 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<(CHOOSE b14533 \in DOMAIN FALSE : (FALSE => TRUE)), CASE (FALSE => FALSE) -> Head(<<1>>) [] OTHER -> Head(<<1>>)>> % Head(<<(2147483647 \div 0), Head(<<3, 1, 2>>)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09362 failed.
    Attempted to apply the operator DOMAIN to a non-function
    (a Boolean value)
    line 14, col 38 to line 14, col 49 of module random_09362
---*)
