(*---
description: Evaluates a random bool expression, seed 262, number 1780.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01780 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b2816 \in DOMAIN ([a |-> 1] @@ <<5, 6>>) : ((TRUE /\ TRUE) /\ (3 = 3))) \/ (((2147483647 \cup {x \in 1..3 : x > 1}) \subseteq (SUBSET {1} \cap {2, 1, 3})) /\ (Append(<<1>>, 1) = [<<5, 6>> EXCEPT ![7] = 3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01780 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.CombineFcn(tlc2.value.impl.Value,tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
