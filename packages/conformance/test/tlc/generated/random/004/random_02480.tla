(*---
description: Evaluates a random set expression, seed 262, number 2480.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02480 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({IF (b3899 \in Nat) THEN ([a |-> 1, b |-> TRUE]).a ELSE (-b3899) : b3899 \in {Cardinality({2, 1, 3}) : b3900 \in (0 .. <<1>>)}} \ <<CASE (FALSE <=> TRUE) -> (3 % 3) [] OTHER -> ([x \in Nat |-> x + 1])[<<>>], ((FALSE /\ FALSE) - (FALSE + 0))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02480 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
