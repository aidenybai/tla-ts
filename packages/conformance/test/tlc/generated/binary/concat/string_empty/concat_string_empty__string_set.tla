(*---
description: concat of string_empty, a StringValue, and string_set, a UserValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_string_empty__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") \o (STRING))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    STRING
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    STRING
---*)
