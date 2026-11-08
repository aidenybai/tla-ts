(*---
description: Evaluates a random int expression, seed 262, number 395.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00395 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-LET b652 == ((7 \div 2) % (-1 \div 2147483647)) IN Cardinality((<<3, 1, 2>> \ {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00395 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    <<3, 1, 2>>
    is not enumerable.
---*)
