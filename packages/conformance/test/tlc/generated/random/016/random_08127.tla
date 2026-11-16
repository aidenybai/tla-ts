(*---
description: Evaluates a random set expression, seed 262, number 8127.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08127 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(<<(-1 + 2147483647), LET b12556 == 7 IN 2147483647>> \div (Len(<<1>>) % (7 + -1))), (CHOOSE b12557 \in DOMAIN ([x \in Nat |-> x + 1] @@ (1 :> 2)) : (DOMAIN [x \in Nat |-> x + 1] < LET b12558 == 7 IN <<1, 2>>))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08127 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
