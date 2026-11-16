(*---
description: Evaluates a random bool expression, seed 262, number 526.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00526 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<((1 \o <<1>>) % (7 - 2147483647)), LET b885 == (--1) IN ([a |-> 1, b |-> TRUE]).a>> = [b886 \in (Len(<<3, 1, 2>>) .. ([a |-> 1, b |-> TRUE] + 1)) |-> ((CHOOSE b887 \in {1} : TRUE) * (--1))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 69 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 66.
    | Expression starting at line 14, column 66.
    | Definition starting at line 14, column 58.
    | Let Definitions starting at line 14, column 58.
    | Case Other Arm starting at line 14, column 54.
    | Fatal errors while parsing TLA+ spec in file random_00526
    | In module random_00526
    | Could not parse module random_00526 from file random_00526.tla
    | *** Errors: 1
    | In module random_00526
    | Could not parse module random_00526 from file random_00526.tla
    3002:1 Parsing or semantic analysis failed.
---*)
