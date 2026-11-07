(*---
description: Evaluates a random set expression, seed 262, number 2254.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02254 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({CASE (<<3, 1, 2>> = (1 :> 2)) -> ([x \in 1..2 |-> x])[7] [] OTHER -> [<<5, 6>> EXCEPT ![0] = 1], Len([<<3, 1, 2>> EXCEPT ![1] = 1])} \cup (CASE (2..1 \subseteq {2, 1, 3}) -> (2 \div 7) [] OTHER -> LET b3550 == 2 IN 0 .. (IF TRUE THEN -1 ELSE 7 % (FALSE \/ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 88 to line 14, col 95 of module random_02254
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 3 with non-integer:
    <<5, 6>>
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 3 with non-integer:
    <<5, 6>>
---*)
