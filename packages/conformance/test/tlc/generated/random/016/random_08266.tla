(*---
description: Evaluates a random set expression, seed 262, number 8266.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08266 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(-LET b12798 == 1 IN -1) : b12797 \in ({1 : b12799 \in 2..1} \cap DOMAIN [x \in Nat |-> x + 1])} \ {((b12800 \div 1..3) \div (7 \div 3)) : b12800 \in (Head(<<1>>) .. (CHOOSE b12801 \in {2, 1, 3} : TRUE))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08266 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.IntervalValue to tlc2.value.impl.IntValue
---*)
