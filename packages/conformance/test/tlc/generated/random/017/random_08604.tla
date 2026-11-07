(*---
description: Evaluates a random set expression, seed 262, number 8604.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08604 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {{LET b13329 == b13328 IN -1 : b13328 \in {0, -1}}, {b13330 \in (SUBSET {1} \ SUBSET {1}) : [[a |-> 1] EXCEPT !.a = -1]}}, (((2147483647 % 7) .. (<<1, 2>> % 2147483647)) \cup (({x \in 1..3 : x > 1} \cup {x \in 1..3 : x > 1}) \cap DOMAIN (1 :> 2)))})
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
