(*---
description: Evaluates a random set expression, seed 262, number 7972.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07972 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({IF FALSE THEN -1 ELSE 2, Cardinality((1 :> 2))} \cap UNION {(SUBSET {1} \cap SUBSET {1}), {b12307 \in {1} : FALSE}}), ((LET b12308 == 2147483647 IN 3 + (3 % 2)) .. IF SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) THEN CASE FALSE -> 2 [] OTHER -> -1 ELSE Cardinality([x \in 1..2 |-> x]))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<2>>
    2181:0 Attempted to compute cardinality of the value
    <<2>>
---*)
