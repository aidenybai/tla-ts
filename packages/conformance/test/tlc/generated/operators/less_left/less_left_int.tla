(*---
description: less_left applied to int, a UserValue.
ref: tlc2/module/Naturals.java#LT
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE less_left_int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Int < 2)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    Int
    2266:0 The first argument of < should be an integer, but instead it is:
    Int
---*)
