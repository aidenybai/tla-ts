(*---
description: Evaluates a random function expression, seed 262, number 3363.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03363 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((2147483647 - 1) :> (1 % 3)) @@ [b5340 \in UNION {Nat, Nat} |-> [a |-> 7, b |-> FALSE]]) EXCEPT ![Head(Tail(SortSeq(<<1>>, LAMBDA p, q : p < q)))] = (UNION {{7 : b5341 \in {1, 2}}, (<<3, 1, 2>> .. 2)} \cap (DOMAIN <<5, 6>> \ ({2, 1, 3} \ {x \in 1..3 : x > 1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate UNION(s), but some element of s is nonenumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate UNION(s), but some element of s is nonenumerable.
---*)
