(*---
description: Evaluates a random int expression, seed 262, number 3282.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03282 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b5221 == CASE TRUE -> 1 [] OTHER -> -1 IN (2 * 7) % ([b5222 \in 2..1 |-> -1] % Len(<<3, 1, 2>>))) * ((IF FALSE THEN 3 ELSE 2 % (-1)) - Len(Append(<<3, 1, 2>>, 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03282 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
