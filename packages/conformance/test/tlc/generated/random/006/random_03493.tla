(*---
description: Evaluates a random set expression, seed 262, number 3493.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03493 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({7, 1} \ ({x \in 1..3 : x > 1} \ 1..3)) \cup ({b5519 \in Nat : TRUE} \ (1..3 \cup {2, 1, 3}))) \cup (UNION {{3, -1}, (<<3, 1, 2>> \o <<1, 2>>)} \cup UNION {({2, 1, 3} \cap 1..3), (0 .. 1)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03493 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the function <<3, 1, 2, 1, 2>> with the value:
    {-1, 3}
---*)
