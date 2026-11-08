(*---
description: Evaluates a random bool expression, seed 262, number 2021.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02021 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SortSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), LAMBDA p, q : p < q), Cardinality((Nat \cup {1, 2}))) = [((CHOOSE f \in [1..2 -> 1..2] : TRUE) @@ (1 :> 1)) EXCEPT ![LET b3208 == Cardinality({x \in 1..3 : x > 1}) IN Cardinality(Nat)] = {b3209 \in (CHOOSE f \in [{1, 2} -> {0} \cup {1}] : TRUE) : ([a |-> 1] = [a |-> 1, b |-> TRUE])}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02021 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {1, 2}
    and T:
    Nat
    are not both enumerable
---*)
