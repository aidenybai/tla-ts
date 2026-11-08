(*---
description: Evaluates a random function expression, seed 262, number 9531.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09531 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (\E b14810 \in {-1 : b14811 \in SUBSET {1}} : (~FALSE)) THEN ([[a |-> 1] EXCEPT !.a = @ + 3] * (7 + 1)) ELSE CASE ({x \in 1..3 : x > 1} = 2..1) -> Len(<<1>>) [] OTHER -> (-7) :> (CHOOSE b14812 \in DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![-1] = -1] : ((FALSE /\ TRUE) <=> (CHOOSE r \in [a : {1, 2}] : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09531 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
