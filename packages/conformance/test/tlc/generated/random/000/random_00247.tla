(*---
description: Evaluates a random int expression, seed 262, number 247.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00247 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ({b405 \in {2 : b406 \in SUBSET {1}} : (FALSE \/ TRUE)} = ({b407 : b407 \in -1} \cup {Nat, -1})) THEN Head(Append(IF TRUE THEN 2 ELSE 2147483647, (2147483647 * 0))) ELSE Len(SubSeq(Tail(<<1, 2>>), Cardinality({}), (2147483647 * {2, 1, 3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00247 failed.
    TLC encountered a non-enumerable quantifier bound
    -1.
    line 14, col 95 to line 14, col 96 of module random_00247
---*)
