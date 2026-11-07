(*---
description: Evaluates a random function expression, seed 262, number 8332.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08332 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([([b12889 \in {1, 2} |-> b12889] @@ [[x \in 1..2 |-> x] EXCEPT ![2147483647] = 3]) EXCEPT ![((-1 % 1) * (-2147483647))] = (IF FALSE THEN 2147483647 ELSE 7 + (CHOOSE b12890 \in {1} : TRUE))] :> (((<<1>> \o <<3, 1, 2>>) \div CASE FALSE -> -1 [] OTHER -> 7) + ((3 % [x \in Nat |-> x + 1]) % [2147483647 EXCEPT ![2147483647] = 2147483647]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 54 to line 14, col 71 of module random_08332
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 97 of module random_08332
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Divide(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
