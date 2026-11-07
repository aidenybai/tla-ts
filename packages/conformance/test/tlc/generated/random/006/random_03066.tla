(*---
description: Evaluates a random function expression, seed 262, number 3066.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03066 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ({} \in Nat) -> (3 \div 0) [] OTHER -> Len(<<3, 1, 2>>) * Len((<<>> \o <<1>>))) :> (LET b4865 == (2 + 7) IN Cardinality({x \in 1..3 : x > 1}) % (Head(<<>>) * [[a |-> 1] EXCEPT !.a = -1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
---*)
