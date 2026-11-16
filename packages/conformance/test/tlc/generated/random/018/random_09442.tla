(*---
description: Evaluates a random set expression, seed 262, number 9442.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09442 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(Head(<<1, 1>>) :> (CASE TRUE -> 7 [] OTHER -> 2147483647 - ([a |-> 1] % -1))), {((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a : b14654 \in DOMAIN [b14655 \in 2..1 |-> -1]}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09442 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    <<7>>
---*)
