(*---
description: Evaluates a random seq expression, seed 262, number 4399.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04399 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<SelectSeq(Append(SubSeq(<<3, 1, 2>>, 0, 0), IF {} THEN 7 ELSE 0), LAMBDA e : e > 0), CASE (UNION {1..3, {1}} = {3, 3}) -> (LET b6920 == 7 IN b6920 - (--1)) [] OTHER -> ([[a |-> 1] EXCEPT !.a = -1]).a>>)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 170 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 167.
    | ExtendableExpr starting at line 14, column 159.
    | Expression starting at line 14, column 159.
    | Case Other Arm starting at line 14, column 141.
    | Expression starting at line 14, column 141.
    | Fatal errors while parsing TLA+ spec in file random_04399
    | In module random_04399
    | Could not parse module random_04399 from file random_04399.tla
    | *** Errors: 1
    | In module random_04399
    | Could not parse module random_04399 from file random_04399.tla
    3002:1 Parsing or semantic analysis failed.
---*)
