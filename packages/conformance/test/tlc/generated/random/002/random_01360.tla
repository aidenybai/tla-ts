(*---
description: Evaluates a random set expression, seed 262, number 1360.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01360 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b2164 \in DOMAIN (<<5, 6>> @@ (1 :> 2)) : (\E b2165 \in (1..3 \cup {1}) : ({1} \subseteq {}))} \cup (((SUBSET {1} \cup 2..1) \cap SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)) \ {b2166 \in (FALSE \/ TRUE) : (<<1, 2>> = <<5, 6>>)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check set membership in a tuple value.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to check set membership in a tuple value.
---*)
