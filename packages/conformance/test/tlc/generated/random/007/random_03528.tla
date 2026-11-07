(*---
description: Evaluates a random function expression, seed 262, number 3528.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03528 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(Append([a |-> 1], 3)) \div Len(SubSeq(<<1, 2>>, 2147483647, 1))) :> (Cardinality((Nat \ {1, 2})) % ((CHOOSE b5578 \in {x \in 1..3 : x > 1} : TRUE) % (SUBSET {1} \ 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> 1]
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> 1]
---*)
