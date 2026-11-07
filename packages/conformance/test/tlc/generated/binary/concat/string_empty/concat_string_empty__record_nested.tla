(*---
description: concat of string_empty, a StringValue, and record_nested, a RecordValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_string_empty__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") \o ([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    [a |-> [b |-> <<1>>]]
    2182:0 Evaluating an expression of the form t \o s when s is not a string:
    [a |-> [b |-> <<1>>]]
---*)
