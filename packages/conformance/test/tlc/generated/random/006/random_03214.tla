(*---
description: Evaluates a random seq expression, seed 262, number 3214.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03214 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((Tail(Append(<<1, 2>>, -1)) \o (SelectSeq(<<1, 2>>, LAMBDA e : e > 0) \o IF TRUE THEN 0 ELSE 7)), Len((SelectSeq(<<1, 2>>, LAMBDA e : e > 0) \o <<2, -1>>)), ([b5104 \in UNION {{x \in 1..3 : x > 1}, Nat} |-> IF TRUE THEN 7 ELSE 1])[(CHOOSE b5105 \in {0, 2147483647} : (2147483647 = b5105))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    0
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    0
---*)
