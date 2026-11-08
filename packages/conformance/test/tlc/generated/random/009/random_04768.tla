(*---
description: Evaluates a random int expression, seed 262, number 4768.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04768 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b7450 == ((-2) \div ([a |-> 1]).a) IN Head(Append(<<1>>, 3)) \div ((Head(<<1, 2>>) + Cardinality(Nat)) * IF (TRUE => FALSE) THEN (-1 - [a |-> 1]) ELSE (0 * 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04768 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
