(*---
description: Evaluates a random seq expression, seed 262, number 2778.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02778 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)), ((<<1>> % 0) + [[a |-> 1] EXCEPT !.a = @ + 1])>>, LET b4388 == ((CHOOSE b4389 \in Nat : TRUE) * LET b4390 == 2 IN b4390) IN Cardinality(UNION {{x \in 1..3 : x > 1}, Nat})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
