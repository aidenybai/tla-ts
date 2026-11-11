(*---
description: Evaluates a random function expression, seed 262, number 2766.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02766 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head([<<1>> EXCEPT ![1] = 7]) + (IF FALSE THEN Nat ELSE {x \in 1..3 : x > 1} % Len(<<1>>))) :> LET b4363 == ((2147483647 * -1) - (2 % 0)) IN LET b4364 == Head(<<3, 1, 2>>) IN Head(<<1, 2>>)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 139 to line 14, col 139 of module random_02766 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 128.
    | Expression starting at line 14, column 128.
    | ExtendableExpr starting at line 14, column 127.
    | Expression starting at line 14, column 127.
    | ExtendableExpr starting at line 14, column 126.
    | Fatal errors while parsing TLA+ spec in file random_02766
    | In module random_02766
    | Could not parse module random_02766 from file random_02766.tla
    | *** Errors: 1
    | In module random_02766
    | Could not parse module random_02766 from file random_02766.tla
    3002:1 Parsing or semantic analysis failed.
---*)
