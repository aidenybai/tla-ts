(*---
description: concat of string_escapes, a StringValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_string_escapes__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") \o ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    [x \in Nat |-> <expression line 14, col 49 to line 14, col 49 of module concat_string_escapes__function_lazy>]
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    [x \in Nat |-> <expression line 14, col 49 to line 14, col 49 of module concat_string_escapes__function_lazy>]
---*)
