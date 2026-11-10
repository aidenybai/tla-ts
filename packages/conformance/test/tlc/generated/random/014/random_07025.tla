(*---
description: Evaluates a random seq expression, seed 262, number 7025.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07025 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail([b10775 \in ((1 :> 2) \cup {1, 2}) |-> Cardinality(b10775)]), (Head(SubSeq(<<3, 1, 2>>, 0, 7)) % CASE (FALSE /\ FALSE) -> LET b10776 == 0 IN 7 [] OTHER -> (3 :> 1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07025 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Tail(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \cup T when S:
    {1, 2}
    and T:
    <<2>>
    are not both enumerable
---*)
