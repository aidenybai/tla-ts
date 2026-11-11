(*---
description: Evaluates a random set expression, seed 262, number 1380.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01380 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(Head(Append(<<1, 2>>, 0)) .. LET b2203 == (CHOOSE b2204 \in 2..1 : TRUE) IN CASE FALSE -> b2203 [] OTHER -> 1), {Cardinality((Nat \ {})), Head(SubSeq(<<3, 1, 2>>, -1, 3))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01380 failed.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),
    but it produced the following error:
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
