(*---
description: Evaluates a random bool expression, seed 262, number 2466.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02466 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN (<<1>> @@ [x \in Nat |-> x + 1]) \cup (DOMAIN <<5, 6>> \ {2, -1})) \subseteq {b3885 \in (CASE TRUE -> 3 [] OTHER -> 3 .. ([a |-> 1, b |-> TRUE]).a) : (SubSeq(<<1, 2>>, 1, b3885) = (1 :> 0))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02466 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to compute the number of elements in the overridden value Nat.
---*)
