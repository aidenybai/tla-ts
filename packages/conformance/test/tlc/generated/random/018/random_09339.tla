(*---
description: Evaluates a random int expression, seed 262, number 9339.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09339 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((Len(<<3, 1, 2>>) :> Len(<<1, 2>>)) @@ (([a |-> 1, b |-> TRUE]).a :> (1 \div 7))) EXCEPT ![Cardinality({(0 + b14490) : b14490 \in DOMAIN <<5, 6>>})] = IF (Tail([a |-> 1]) = ([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1])) THEN ((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a ELSE LET b14491 == Cardinality({}) IN (-b14491)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 97 of module random_09339
    | (1 :> 0 @@ 3 :> 2)
---*)
