(*---
description: Evaluates a random set expression, seed 262, number 5228.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05228 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(Append(3, 1)) - IF (2..1 \subseteq Nat) THEN [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7] ELSE LET b8101 == 0 IN 3) .. Len(<<LET b8102 == 7 IN b8102, Tail(<<1>>)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    3
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    3
---*)
