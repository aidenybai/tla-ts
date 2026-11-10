(*---
description: concat of string_a, a StringValue, and function_pair_domain, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_string_a__function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a") \o ([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module concat_string_a__function_pair_domain failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    (<<1, 2>> :> 3)
---*)
