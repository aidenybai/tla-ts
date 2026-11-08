(*---
description: Evaluates a random record expression, seed 262, number 2444.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02444 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 7] EXCEPT !.a = ([a |-> 1, b |-> TRUE]).a] EXCEPT !.a = @ + (-IF TRUE THEN [a |-> 1] ELSE Nat)] EXCEPT !.a = @ + ((DOMAIN <<5, 6>> \cup UNION {{1, 2}, 2147483647}) \ UNION {{b3857 \in {1} : FALSE}, {b3858 \in SUBSET {1} : TRUE}})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02444 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
