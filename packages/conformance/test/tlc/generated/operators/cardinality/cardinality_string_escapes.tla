(*---
description: cardinality applied to string_escapes, a StringValue.
ref: tlc2/module/FiniteSets.java#Cardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cardinality_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    "a\"b\\c\n"
    2181:0 Attempted to compute cardinality of the value
    "a\"b\\c\n"
---*)
