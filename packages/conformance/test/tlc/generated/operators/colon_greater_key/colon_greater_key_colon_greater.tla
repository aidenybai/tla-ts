(*---
description: colon_greater_key applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1 :> 2 :> 1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops :> in block line 14, col 18 to line 14, col 19 of module colon_greater_key_colon_greater and :>.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 21.
    | ExtendableExpr starting at line 14, column 16.
    | Expression starting at line 14, column 16.
    | Optional Arguments starting at line 14, column 15.
    | Primitive expression starting at line 14, column 9.
    | Fatal errors while parsing TLA+ spec in file colon_greater_key_colon_greater
    | In module colon_greater_key_colon_greater
    | Could not parse module colon_greater_key_colon_greater from file colon_greater_key_colon_greater.tla
    | *** Errors: 1
    | In module colon_greater_key_colon_greater
    | Could not parse module colon_greater_key_colon_greater from file colon_greater_key_colon_greater.tla
    3002:1 Parsing or semantic analysis failed.
---*)
