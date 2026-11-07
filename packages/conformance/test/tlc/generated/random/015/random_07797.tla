(*---
description: Evaluates a random record expression, seed 262, number 7797.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07797 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + (Len(TRUE) % IF TRUE THEN 2 ELSE 3)] EXCEPT !.a = @ + CASE ((TRUE \/ FALSE) => ({} = {1})) -> (Len(3) + Head(<<3, 1, 2>>)) [] OTHER -> LET b12026 == ([a |-> 1, b |-> TRUE]).a IN Len(<<1, 2>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
---*)
