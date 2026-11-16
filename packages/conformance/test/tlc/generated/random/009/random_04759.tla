(*---
description: Evaluates a random set expression, seed 262, number 4759.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04759 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-(0 \div b7428)) : b7428 \in {(TRUE + 1), Head(<<1>>)}} \ DOMAIN [(CHOOSE f \in [1..2 -> {2, 1, 3}] : TRUE) EXCEPT ![(CHOOSE b7429 \in 2..1 : FALSE)] = Len(<<3, 1, 2>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04759 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
