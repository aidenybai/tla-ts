(*---
description: Evaluates a random set expression, seed 262, number 9199.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09199 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1 .. {x \in 1..3 : x > 1}) \ UNION {{x \in 1..3 : x > 1}, {2, 1, 3}}) \cup (SortSeq(<<1, 2>>, LAMBDA p, q : p < q) .. (-1 - 2147483647))) \cup {b14275 \in ((-1 * 3) .. LET b14276 == 0 IN 7) : ((Nat = SUBSET {1}) /\ ([a |-> 1] = [a |-> 1]))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09199 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetEnumValue to tlc2.value.impl.IntValue
---*)
