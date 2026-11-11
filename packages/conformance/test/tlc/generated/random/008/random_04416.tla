(*---
description: Evaluates a random seq expression, seed 262, number 4416.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04416 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq(<<(<<5, 6>>)[<<1, 2>>], (3 + -1)>>, (Len(<<3, 1, 2>>) * CASE TRUE -> 7 [] OTHER -> 0), CASE (<<>> = (1 :> 2)) -> Head(<<3, 1, 2>>) [] OTHER -> Head(<<1>>)), IF ((0 < -1) <=> ({} = {})) THEN (((1 :> 2))[2147483647] \div ([a |-> 1]).a) ELSE Head(Append(<<3, 1, 2>>, 2)), (Cardinality(({} \cup 1..3)) - Cardinality(({1} \cap 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04416 failed.
    Attempted to access tuple at a non integral index: <<1, 2>>
---*)
