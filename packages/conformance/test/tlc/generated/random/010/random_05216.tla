(*---
description: Evaluates a random int expression, seed 262, number 5216.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05216 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b8092 == (CHOOSE b8093 \in (({} \cap 2..1) \ (2 \in {2, 1, 3})) : (CASE FALSE -> b8093 [] OTHER -> b8093 < CASE FALSE -> 2147483647 [] OTHER -> [a |-> 1, b |-> TRUE])) IN Head(SubSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), IF FALSE THEN b8092 ELSE 2147483647, (7 - [a |-> 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05216 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
