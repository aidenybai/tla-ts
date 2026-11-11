(*---
description: Evaluates a random seq expression, seed 262, number 3555.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03555 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(SelectSeq(Append(<<>>, 2147483647), LAMBDA e : e > 0), ([b5622 \in Nat |-> 2])[Cardinality(Nat)]), IF (SelectSeq(<<>>, LAMBDA e : e > 0) = (2 \div 2147483647)) THEN (Cardinality(1..3) * CASE FALSE -> -1 [] OTHER -> 0) ELSE (Head(<<>>) * ([a |-> 1]).a), (Head(<<3, 7>>) % CASE (3 \in 1..3) -> LET b5623 == 7 IN 7 [] OTHER -> (CHOOSE f \in [{1, 2} \cap {2} -> 1..2] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03555 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
