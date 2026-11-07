(*---
description: subbag applied to function_strings, a FcnRcdValue.
ref: tlc2/module/Bags.java#SubBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subbag_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubBag([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
    2266:0 The first argument of >= should be an integer, but instead it is:
    "a"
---*)
