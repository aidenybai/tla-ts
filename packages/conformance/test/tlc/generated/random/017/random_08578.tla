(*---
description: Evaluates a random function expression, seed 262, number 8578.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08578 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b13291 \in (SelectSeq(<<1, 2>>, LAMBDA e : e > 0) \ ([x \in 1..2 |-> x] .. 1)) |-> CASE (b13291 < 2147483647) -> (-<<5, 6>>) [] OTHER -> (3 * b13291)] @@ [((3 - 0) :> (1 * 1)) EXCEPT ![(CHOOSE f \in [{1, 2} \cap {2} -> {0} \cup {1}] : TRUE)] = Head(Tail(TRUE))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08578 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
