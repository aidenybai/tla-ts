(*---
description: Evaluates a random set expression, seed 262, number 6836.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06836 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [[(<<5, 6>> @@ [x \in 1..2 |-> x]) EXCEPT ![(-1 % 2147483647)] = Cardinality({x \in 1..3 : x > 1})] EXCEPT ![Cardinality((-1 .. 2147483647))] = IF (FALSE => TRUE) THEN IF FALSE THEN 7 ELSE 3 ELSE CASE TRUE -> 7 [] OTHER -> 0])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 55 of module random_06836
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Size of interval value exceeds the maximum representable size (32bits): -1..2147483647.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Size of interval value exceeds the maximum representable size (32bits): -1..2147483647.
---*)
