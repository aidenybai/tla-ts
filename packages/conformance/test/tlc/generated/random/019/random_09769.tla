(*---
description: Evaluates a random bool expression, seed 262, number 9769.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09769 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 .. 0) = (0 .. 2)))[IF (FALSE <=> TRUE) THEN {b15164 \in 1..3 : TRUE} ELSE (0 + 2)] = ((-(0 * -1)) * ((7 :> 0))[([x \in 1..2 |-> x])[-1]])))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 114 to line 14, col 114 of module random_09769 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 112.
    | Expression starting at line 14, column 112.
    | ExtendableExpr starting at line 14, column 111.
    | Expression starting at line 14, column 110.
    | ExtendableExpr starting at line 14, column 109.
    | Fatal errors while parsing TLA+ spec in file random_09769
    | In module random_09769
    | Could not parse module random_09769 from file random_09769.tla
    | *** Errors: 1
    | In module random_09769
    | Could not parse module random_09769 from file random_09769.tla
    3002:1 Parsing or semantic analysis failed.
---*)
