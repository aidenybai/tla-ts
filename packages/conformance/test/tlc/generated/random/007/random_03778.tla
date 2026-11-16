(*---
description: Evaluates a random int expression, seed 262, number 3778.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03778 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b5964 \in (Len(SelectSeq(<<>>, LAMBDA e : e > 0)) .. ((1 \div 2147483647) - ([x \in 1..2 |-> x] % 3))) : (([[x \in 1..2 |-> x] EXCEPT ![-1] = 3] \cap {b5964, b5964}) \subseteq Tail(SubSeq(<<3, 1, 2>>, 7, b5964)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03778 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
