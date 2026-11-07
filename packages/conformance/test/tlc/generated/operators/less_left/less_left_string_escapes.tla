(*---
description: less_left applied to string_escapes, a StringValue.
ref: tlc2/module/Naturals.java#LT
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_left_string_escapes ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT("a\"b\\c\n" < 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    "a\"b\\c\n"
    2266:0 The first argument of < should be an integer, but instead it is:
    "a\"b\\c\n"
---*)
