(*---
description: Evaluates a random set expression, seed 262, number 866.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00866 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(({2, 1, 3} \div b1400) \div ([x \in Nat |-> x + 1])[1]) : b1400 \in {(<<1, 2>> \o [x \in Nat |-> x + 1]), (2 - 3)}} \cup {b1401 \in {CASE FALSE -> 1 [] OTHER -> 0 : b1402 \in (1..3 \cup Nat)} : [b1403 \in ({1, 2} \cap SUBSET {1}) |-> Len(<<3, 1, 2>>)]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00866 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Concat(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
