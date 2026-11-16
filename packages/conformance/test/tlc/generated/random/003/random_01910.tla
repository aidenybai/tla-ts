(*---
description: Evaluates a random seq expression, seed 262, number 1910.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01910 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE ((CHOOSE b2998 \in SUBSET {1} : TRUE) \in (7 \ {x \in 1..3 : x > 1})) -> LET b2999 == CASE <<5, 6>> -> 7 [] OTHER -> 3 IN Cardinality(Nat) [] OTHER -> Head(<<3, -1>>), ((-Head(<<1, 2>>)) + LET b3000 == (-3) IN Len(<<1, 2>>))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01910 failed.
    Attempted to check if the value:
    {}
    is an element of the integer 7
---*)
