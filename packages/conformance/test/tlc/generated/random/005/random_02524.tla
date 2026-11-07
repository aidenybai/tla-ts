(*---
description: Evaluates a random seq expression, seed 262, number 2524.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02524 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3981 \in [((1 + 0) :> CASE FALSE -> -1 [] OTHER -> 2147483647) EXCEPT ![((0 % 1) + Head(<<1>>))] = Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))] |-> Len(SortSeq(Append(<<3, 1, 2>>, 2), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b3981 \\in <<3>> |-> <expression line 14, col 169 to line 14, col 225 of module random_02524>]"
---*)
