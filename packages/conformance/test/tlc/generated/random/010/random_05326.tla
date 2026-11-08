(*---
description: Evaluates a random seq expression, seed 262, number 5326.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05326 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> IF FALSE THEN 0 ELSE 2147483647, b |-> (2..1 = {1, 2})] EXCEPT !.a = @ + ((-[a |-> 1]) % Cardinality({}))] EXCEPT !.a = @ + CASE (\A b8239 \in {1 : b8240 \in {1}} : (b8239 = 7)) -> Len(Tail(<<1, 2>>)) [] OTHER -> [[b8241 \in SUBSET {1} |-> 3] EXCEPT ![Head(<<3, 1, 2>>)] = Cardinality(<<>>)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05326 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
