(*---
description: Evaluates a random seq expression, seed 262, number 841.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00841 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b1370 \in {CASE FALSE -> SUBSET {1} [] OTHER -> 2, (3 % 3)} |-> Cardinality(UNION {SUBSET {1}, {x \in 1..3 : x > 1}})] = CASE (Len(<<1>>) < ([a |-> 1, b |-> TRUE]).a) -> (Head(<<1>>) - ([a |-> 1, b |-> TRUE]).a) [] OTHER -> (CHOOSE b1371 \in ({x \in 1..3 : x > 1} \cup Nat) : (<<1>> = [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 2 with non-integer:
    {}
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compare integer 2 with non-integer:
    {}
---*)
