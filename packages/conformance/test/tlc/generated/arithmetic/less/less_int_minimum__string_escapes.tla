(*---
description: < of int_minimum and string_escapes, including overflow and type errors.
ref: tlc2/module/Naturals.java; tlc2/module/Integers.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_int_minimum__string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) < ("a\"b\\c\n"))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    "a\"b\\c\n"
    2266:0 The second argument of < should be an integer, but instead it is:
    "a\"b\\c\n"
---*)
