(*---
description: Evaluates a random seq expression, seed 262, number 4.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00004 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(Len(Append(<<1>>, -1)) - (UNION {{1}, 7} \ (2147483647 .. 1))), CASE ((2 .. 2147483647) \subseteq (1..3 \ {x \in 1..3 : x > 1})) -> (CHOOSE b6 \in (3 .. 3) : (2..1 \subseteq Nat)) [] OTHER -> ((2147483647 :> 2147483647))[(-1 * 0)]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00004 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Minus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetDiffValue to tlc2.value.impl.IntValue
---*)
