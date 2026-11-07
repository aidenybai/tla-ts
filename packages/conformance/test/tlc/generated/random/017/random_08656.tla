(*---
description: Evaluates a random bool expression, seed 262, number 8656.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08656 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE FALSE -> 7 [] OTHER -> 0 % (2147483647 :> 2)) * CASE (TRUE => TRUE) -> Cardinality(Nat) [] OTHER -> (3 * 1)) \in (UNION {({} \ 2..1), (<<3, 1, 2>> \o <<1>>)} \cup (\E b13393 \in ({} \ 2..1) : (FALSE \/ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
