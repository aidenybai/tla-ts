(*---
description: Evaluates a random function expression, seed 262, number 5006.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05006 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7786 \in ({(CHOOSE b7788 \in {1} : TRUE) : b7787 \in (2..1 \cap {1, 2})} \cap ((7 - 0) .. (CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE))) |-> (CHOOSE b7789 \in (({1} \ Nat) \cap ({1, 2} \ {x \in 1..3 : x > 1})) : ((b7789 :> b7786))[LET b7790 == b7786 IN 3])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05006 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.FcnRcdValue to tlc2.value.impl.IntValue
---*)
