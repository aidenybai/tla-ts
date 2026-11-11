(*---
description: Evaluates a random set expression, seed 262, number 9581.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09581 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(\E b14873 \in ((FALSE \cap {x \in 1..3 : x > 1}) \ DOMAIN <<5, 6>>) : ((b14873 = b14873) \subseteq (2..1 \ {x \in 1..3 : x > 1}))), ({IF TRUE THEN b14874 ELSE 1 : b14874 \in {b14875 \in {} : TRUE}} \cup ((-2147483647) .. Head(<<1, 2>>)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09581 failed.
    Attempted to check if the value:
    2
    is an element of the boolean FALSE
---*)
