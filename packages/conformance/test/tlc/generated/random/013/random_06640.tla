(*---
description: Evaluates a random seq expression, seed 262, number 6640.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06640 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq(([<<3, 1, 2>> EXCEPT ![1] = 0] \o SelectSeq(<<1, 2>>, LAMBDA e : e > 0)), Len(<<SUBSET {1}, [a |-> 1, b |-> TRUE]>>), ([b10188 \in 1..3 |-> b10188])[IF FALSE THEN 2 ELSE 2]), (LET b10189 == (7 - -1) IN Cardinality({x \in 1..3 : x > 1}) * <<CASE TRUE -> 0 [] OTHER -> TRUE, IF TRUE THEN -1 ELSE -1>>), ((SelectSeq(<<1>>, LAMBDA e : e > 0) = [<<5, 6>> EXCEPT ![1..3] = 2147483647]) \/ ((FALSE => FALSE) <=> (~TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06640 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.TupleValue to tlc2.value.impl.IntValue
---*)
