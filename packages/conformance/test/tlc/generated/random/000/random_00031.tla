(*---
description: Evaluates a random seq expression, seed 262, number 31.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00031 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b49 == Len((UNION {Nat, {}} => (2 < 1))) IN ((([a |-> 1]).a * LET b50 == 3 IN 0) + ((b49 :> 0))[IF FALSE THEN 3 ELSE 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00031 failed.
    Attempted to evaluate an expression of form P => Q when P was
    a set of the form UNION  S.
    line 14, col 32 to line 14, col 57 of module random_00031
---*)
