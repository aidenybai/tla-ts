(*---
description: Evaluates a random set expression, seed 262, number 7791.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07791 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]).a % (Len(<<1>>) * (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE))), CASE ((\E b12016 \in {} : TRUE) => (FALSE /\ TRUE)) -> IF (<<>> = (1 :> 2)) THEN (0 % 2) ELSE (7 % 2147483647) [] OTHER -> (CHOOSE f \in [{} -> 1..2] : TRUE)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07791 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Times(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
