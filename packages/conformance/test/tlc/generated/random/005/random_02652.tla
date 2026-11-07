(*---
description: Evaluates a random function expression, seed 262, number 2652.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02652 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b4187 \in ({b4188 : b4188 \in {}} \ {b4189 \in {2, 1, 3} : FALSE}) |-> (CHOOSE b4190 \in UNION {2..1, Nat} : (1 = 2))] @@ [b4191 \in {(0 % 1), (-(1 :> 2))} |-> ((-7) - ((1 :> 2) \div 2147483647))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
