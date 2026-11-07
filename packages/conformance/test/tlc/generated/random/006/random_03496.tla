(*---
description: Evaluates a random int expression, seed 262, number 3496.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03496 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq([SelectSeq(<<1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = (0 + 3)], (CHOOSE b5523 \in ({1} \cup 2..1) : (TRUE \/ FALSE)), (-(CHOOSE b5524 \in SUBSET {1} : TRUE))), (([<<5, 6>> EXCEPT ![7] = 2147483647])[Head(<<>>)] \div (-([x \in 1..2 |-> x])[1])), ([(CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) EXCEPT !.a = LET b5525 == 1 IN b5525]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
