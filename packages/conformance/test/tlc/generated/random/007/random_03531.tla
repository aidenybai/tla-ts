(*---
description: Evaluates a random seq expression, seed 262, number 3531.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03531 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((SubSeq(<<FALSE, 3>>, Cardinality(Nat), IF TRUE THEN 7 ELSE 3) \o Append([<<1>> EXCEPT ![1] = 2], (-2147483647))), Head(Tail(Tail(FALSE))), ([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = (-1 + 1)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
