(*---
description: greater_equal_right applied to string_escapes, a StringValue.
ref: tlc2/module/Naturals.java#GEQ
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE greater_equal_right_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 >= "a\"b\\c\n")
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of >= should be an integer, but instead it is:
    "a\"b\\c\n"
    2266:0 The second argument of >= should be an integer, but instead it is:
    "a\"b\\c\n"
---*)
