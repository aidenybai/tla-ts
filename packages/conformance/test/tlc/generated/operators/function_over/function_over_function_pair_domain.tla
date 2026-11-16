(*---
description: function_over applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in [x \in {1}, y \in {2} |-> x + y] |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in (<<1, 2>> :> 3) |-> <expression line 14, col 60 to line 14, col 60 of module function_over_function_pair_domain>]"
---*)
