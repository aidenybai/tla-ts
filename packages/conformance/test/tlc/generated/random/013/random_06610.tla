(*---
description: Evaluates a random int expression, seed 262, number 6610.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06610 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b10140 \in (((\A b10141 \in 1..3 : FALSE) * (-1 \div 1)) .. CASE (CHOOSE f \in [{} -> 2..1] : TRUE) -> (7 - 7) [] OTHER -> CASE TRUE -> 2 [] OTHER -> -1) : (((b10140 = 3) <=> (1 \in Nat)) => ([[a |-> 1] EXCEPT !.a = 3] = (CHOOSE r \in [a : {1, 2}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06610 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
