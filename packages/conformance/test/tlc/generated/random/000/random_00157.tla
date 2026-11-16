(*---
description: Evaluates a random record expression, seed 262, number 157.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00157 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-LET b240 == CASE FALSE -> 0 [] OTHER -> 0 IN (--1)), b |-> ([<<2147483647, 2>> EXCEPT !.a = @ + (7 % 0)] = (([a |-> 1, b |-> TRUE])[3] = CASE FALSE -> 2147483647 [] OTHER -> 3))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 73 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 70.
    | Expression starting at line 14, column 70.
    | Case Other Arm starting at line 14, column 25.
    | Expression starting at line 14, column 24.
    | ExtendableExpr starting at line 14, column 23.
    | Fatal errors while parsing TLA+ spec in file random_00157
    | In module random_00157
    | Could not parse module random_00157 from file random_00157.tla
    | *** Errors: 1
    | In module random_00157
    | Could not parse module random_00157 from file random_00157.tla
    3002:1 Parsing or semantic analysis failed.
---*)
