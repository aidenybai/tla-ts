(*---
description: Evaluates a random int expression, seed 262, number 185.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00185 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(<<Head(<<1, 2>>), Len(<<3, 1, 2>>)>>) + ((CHOOSE b296 \in (SUBSET {1} \cap 3) : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])) \div LET b297 == Len(<<5, 6>>) IN CASE TRUE -> 3 [] OTHER -> b297)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00185 failed.
    Attempted to check if the value:
    {}
    is an element of the integer 3
---*)
