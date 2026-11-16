(*---
description: Evaluates a random int expression, seed 262, number 7710.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07710 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b11892 == (LET b11893 == -1 IN -1 * CASE FALSE -> 2 [] OTHER -> 3) IN (Len(<<>>) + (b11892 * 2147483647)) % (-CASE (TRUE <=> FALSE) -> (0 * 2) [] OTHER -> (--1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 179 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 176.
    | Expression starting at line 14, column 176.
    | Case Other Arm starting at line 14, column 167.
    | CASE Expression starting at line 14, column 131.
    | Expression starting at line 14, column 130.
    | Fatal errors while parsing TLA+ spec in file random_07710
    | In module random_07710
    | Could not parse module random_07710 from file random_07710.tla
    | *** Errors: 1
    | In module random_07710
    | Could not parse module random_07710 from file random_07710.tla
    3002:1 Parsing or semantic analysis failed.
---*)
