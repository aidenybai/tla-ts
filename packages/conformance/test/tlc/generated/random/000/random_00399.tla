(*---
description: Evaluates a random set expression, seed 262, number 399.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00399 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{(-1 * 0), Cardinality({2, 1, 3})}, (DOMAIN <<5, 6>> \cap (0 .. 2))} \cap ((([a |-> 1, b |-> TRUE]).a \div (-2147483647)) .. CASE (FALSE \/ TRUE) -> (<<1>> % 1) [] OTHER -> (1 \div 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00399 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
