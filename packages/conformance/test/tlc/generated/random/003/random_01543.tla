(*---
description: Evaluates a random record expression, seed 262, number 1543.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01543 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((-LET b2456 == 3 IN 1) % ((0 - <<1>>) - (3 * 1))), b |-> (\E b2457 \in UNION {{b2458 \in {1, 2} : TRUE}, UNION {{1, 2}, 0}} : ((b2457 - b2457) = LET b2459 == TRUE IN b2457))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01543 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
