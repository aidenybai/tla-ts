(*---
description: Evaluates a random seq expression, seed 262, number 4909.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04909 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head(((SUBSET {1} \subseteq SUBSET {1}) = (--1))), ((LET b7642 == 1 IN b7642 * (--1)) - CASE (FALSE <=> FALSE) -> (2 * 7) [] OTHER -> (-3))>>)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 63 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 60.
    | ExtendableExpr starting at line 14, column 24.
    | Expression starting at line 14, column 24.
    | ExtendableExpr starting at line 14, column 23.
    | Expression starting at line 14, column 23.
    | Fatal errors while parsing TLA+ spec in file random_04909
    | In module random_04909
    | Could not parse module random_04909 from file random_04909.tla
    | *** Errors: 1
    | In module random_04909
    | Could not parse module random_04909 from file random_04909.tla
    3002:1 Parsing or semantic analysis failed.
---*)
