(*---
description: Evaluates a random int expression, seed 262, number 9462.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09462 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b14703 == (((-1 :> <<1>>))[Len(FALSE)] + (Head(<<1, 2>>) - (2 % 2))) IN CASE (([a |-> 1, b |-> TRUE]).a \in {3 : b14704 \in b14703}) -> CASE ((1 :> 2) = 2) -> (b14703 - b14703) [] OTHER -> Cardinality(SUBSET {1}) [] OTHER -> Head(SortSeq(<<1>>, LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    FALSE
    2283:0 The argument of Len should be a sequence, but instead it is:
    FALSE
---*)
