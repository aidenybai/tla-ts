(*---
description: Evaluates a random set expression, seed 262, number 1264.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01264 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE) % ((2 \div b2016) % (b2016 \div b2016))) : b2016 \in (IF (<<>> = <<5, 6>>) THEN LET b2017 == 7 IN 1 ELSE CASE FALSE -> 1 [] OTHER -> 2 .. Len((<<1>> \o <<3, 1, 2>>)))})
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
