(*---
description: Evaluates a random record expression, seed 262, number 5601.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05601 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b8673 \in ({b8674 \in (Nat \cup <<5, 6>>) : (\A b8675 \in SUBSET {1} : FALSE)} \ ((<<1>> \ {1, 2}) \cap (SUBSET {1} \cup 1..3))) : (Len(SubSeq(<<1, 2>>, b8673, b8673)) < ((-b8673) % (b8673 .. -1)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    Nat
    and T:
    <<5, 6>>
    are not both enumerable
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.TLC.PrintT(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    Nat
    and T:
    <<5, 6>>
    are not both enumerable
---*)
