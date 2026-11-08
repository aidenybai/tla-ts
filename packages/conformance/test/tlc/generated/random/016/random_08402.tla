(*---
description: Evaluates a random function expression, seed 262, number 8402.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08402 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b13000 \in UNION {{LET b13001 == 2 IN b13001, (-1 \div 1)}, UNION {(1 .. -1), ({} \cup SUBSET {1})}} |-> (((<<5, 6>> @@ [x \in Nat |-> x + 1]))[LET b13002 == 2147483647 IN 3] + CASE (1..3 \subseteq {1, 2}) -> (b13000 - b13000) [] OTHER -> LET b13003 == b13000 IN 7)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08402 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {} with the value:
    -1
---*)
