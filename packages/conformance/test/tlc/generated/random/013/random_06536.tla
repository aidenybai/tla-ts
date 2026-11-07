(*---
description: Evaluates a random seq expression, seed 262, number 6536.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06536 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(Append(Tail([x \in Nat |-> x + 1]), (-1 \div 3)), LAMBDA e : e > 0) \o SubSeq(Append(Tail({1}), (<<5, 6>>)[7]), ((7 @@ [x \in 1..2 |-> x]))[(7 % 2147483647)], (CASE TRUE -> 7 [] OTHER -> 2 \div (3 % 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Tail(tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
    2154:0 Attempted to apply the operator overridden by the Java method
    public static tlc2.value.impl.Value tlc2.module.Sequences.Tail(tlc2.value.impl.Value),
    but it produced the following error:
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
