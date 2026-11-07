(*---
description: Evaluates a random set expression, seed 262, number 7425.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07425 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((({(CHOOSE b11440 \in {2, 1, 3} : FALSE) : b11439 \in (2..1 \ {1})} \cup {b11441 \in (SUBSET {1} \cap SUBSET {1}) : (TRUE => TRUE)}) .. ([b11442 \in DOMAIN [x \in Nat |-> x + 1] |-> IF FALSE THEN (1 :> 2) ELSE 2147483647])[(([a |-> 1, b |-> TRUE]).a % SortSeq(<<1>>, LAMBDA p, q : p < q))]))
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
