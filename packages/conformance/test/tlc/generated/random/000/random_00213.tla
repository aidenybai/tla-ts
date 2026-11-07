(*---
description: Evaluates a random set expression, seed 262, number 213.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00213 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {((2 % -1) .. LET b346 == 1 IN b346), ({2, 3} \ (SUBSET {1} \ {1}))}, {Head((<<3, 1, 2>> \o <<>>)), CASE (FALSE => FALSE) -> Len(<<1>>) [] OTHER -> (2147483647 \div -1)}})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 189 to line 14, col 192 of module random_00213 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 178.
    | Expression starting at line 14, column 178.
    | ExtendableExpr starting at line 14, column 177.
    | Expression starting at line 14, column 177.
    | Case Other Arm starting at line 14, column 168.
    | Fatal errors while parsing TLA+ spec in file random_00213
    | In module random_00213
    | Could not parse module random_00213 from file random_00213.tla
    | *** Errors: 1
    | In module random_00213
    | Could not parse module random_00213 from file random_00213.tla
    3002:1 Parsing or semantic analysis failed.
---*)
