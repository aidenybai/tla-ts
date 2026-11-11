(*---
description: Evaluates a random set expression, seed 262, number 7417.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07417 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {((Head(<<3, 1, 2>>) .. (SUBSET {1} \cup {1, 2})) \ (({2, 1, 3} \ {2, 1, 3}) \ {b11427 : b11427 \in {1, 2}})), ({b11428 \in ({1, 2} \ {}) : (TRUE => TRUE)} \ ((SUBSET {1} \ {2, 1, 3}) \cap ({x \in 1..3 : x > 1} \cap {1})))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07417 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.SetCupValue to tlc2.value.impl.IntValue
---*)
