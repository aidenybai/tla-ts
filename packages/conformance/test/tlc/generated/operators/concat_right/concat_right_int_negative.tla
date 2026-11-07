(*---
description: concat_right applied to int_negative, a IntValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_right_int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<9>> \o -3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \o in block line 14, col 22 to line 14, col 23 of module concat_right_int_negative and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 16.
    | Expression starting at line 14, column 16.
    | Optional Arguments starting at line 14, column 15.
    | Primitive expression starting at line 14, column 9.
    | ExtendableExpr starting at line 14, column 9.
    | Fatal errors while parsing TLA+ spec in file concat_right_int_negative
    | In module concat_right_int_negative
    | Could not parse module concat_right_int_negative from file concat_right_int_negative.tla
    | *** Errors: 1
    | In module concat_right_int_negative
    | Could not parse module concat_right_int_negative from file concat_right_int_negative.tla
    3002:1 Parsing or semantic analysis failed.
---*)
