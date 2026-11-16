(*---
description: Evaluates a random set expression, seed 262, number 543.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00543 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{CASE (FALSE /\ TRUE) -> Len(<<1>>) [] OTHER -> {[a |-> 1, b |-> TRUE], b921} : b921 \in ((SUBSET {1} \cap Nat) \ {1 : b922 \in FALSE})}, (LET b923 == IF TRUE THEN -1 ELSE 2 IN (-3) = [b924 \in {-1 : b925 \in {x \in 1..3 : x > 1}} |-> Cardinality({})])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00543 failed.
    TLC encountered a non-enumerable quantifier bound
    FALSE.
    line 14, col 151 to line 14, col 155 of module random_00543
---*)
