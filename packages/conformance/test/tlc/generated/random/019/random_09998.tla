(*---
description: Evaluates a random set expression, seed 262, number 9998.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09998 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CHOOSE b15544 \in (1..3 \ {1, 2}) : (\E b15545 \in {2, 1, 3} : FALSE)) % IF (2 = b15543) THEN CASE [a |-> 1] -> -1 [] OTHER -> 0 ELSE Head(<<>>)) : b15543 \in ({b15546 \in UNION {<<3, 1, 2>>, {1}} : (\A b15547 \in {} : TRUE)} \cap ((TRUE + 7) .. ([a |-> 1, b |-> TRUE]).a))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09998 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.BoolValue to tlc2.value.impl.IntValue
---*)
