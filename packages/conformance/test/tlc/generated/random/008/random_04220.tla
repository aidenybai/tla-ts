(*---
description: Evaluates a random set expression, seed 262, number 4220.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04220 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((2 % FALSE) + Head(<<3, 1, 2>>)) + Len(SelectSeq(<<>>, LAMBDA e : e > 0))), (CASE (2 < 3) -> DOMAIN [x \in 1..2 |-> x] [] OTHER -> Cardinality({2, 1, 3}) + Len(<<1, 2>>))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04220 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
