(*---
description: concat of string_escapes, a StringValue, and function_strings, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_string_escapes__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("a\"b\\c\n") \o ([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    [a |-> "a", b |-> "b"]
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    [a |-> "a", b |-> "b"]
---*)
