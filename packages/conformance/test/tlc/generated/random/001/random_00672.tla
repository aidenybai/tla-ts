(*---
description: Evaluates a random function expression, seed 262, number 672.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00672 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Len(SortSeq(<<1>>, LAMBDA p, q : p < q)) :> <<(-1 + 7), Len(<<3, 1, 2>>)>>) EXCEPT ![((-DOMAIN [x \in Nat |-> x + 1]) % IF (TRUE /\ FALSE) THEN LET b1118 == 3 IN -1 ELSE ([a |-> 1, b |-> TRUE]).a)] = LET b1119 == (CHOOSE b1120 \in UNION {SUBSET {1}, 2..1} : (FALSE \/ TRUE)) IN LET b1121 == (-1 * 1) IN (CHOOSE b1122 \in {} : FALSE)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UserValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.UserValue to tlc2.value.impl.IntValue
---*)
