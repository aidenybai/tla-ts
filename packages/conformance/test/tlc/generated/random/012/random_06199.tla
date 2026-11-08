(*---
description: Evaluates a random seq expression, seed 262, number 6199.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06199 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((SelectSeq([<<3, 1, 2>> EXCEPT ![1] = 2], LAMBDA e : e > 0) \o Append(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), ([a |-> 1, b |-> TRUE] % 7))), ((([x \in Nat |-> x + 1] @@ <<5, 6>>) @@ [b9546 \in {1, 2} |-> 2]))[IF (\A b9547 \in {1, 2} : FALSE) THEN (<<1, 2>> = <<5, 6>>) ELSE Len(<<1>>)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06199 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.Integers.Mod(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),
    but it produced the following error:
    Cannot cast tlc2.value.impl.RecordValue to tlc2.value.impl.IntValue
---*)
