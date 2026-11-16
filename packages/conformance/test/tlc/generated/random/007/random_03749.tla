(*---
description: Evaluates a random seq expression, seed 262, number 3749.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03749 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(UNION {({} \cup {x \in 1..3 : x > 1}), ({} \cap {x \in 1..3 : x > 1})}) .. CASE ((1 - 1) = (<<5, 6>>)[0]) -> [[[a |-> 1] EXCEPT !.a = @ + 0] EXCEPT !.a = @ + IF TRUE THEN 2147483647 ELSE 3] [] OTHER -> Head(SubSeq(TRUE, 7, 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03749 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
