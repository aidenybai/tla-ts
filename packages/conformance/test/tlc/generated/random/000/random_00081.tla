(*---
description: Evaluates a random int expression, seed 262, number 81.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00081 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality(UNION {Nat, SUBSET {1}}) + Len(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))) - (((CHOOSE b125 \in SUBSET {1} : FALSE) % (0 % 2)) :> [[a |-> 3, b |-> FALSE] EXCEPT !.a = (-1 < 0)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00081 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare the set {{}, {1}} with the value:
    Nat
---*)
